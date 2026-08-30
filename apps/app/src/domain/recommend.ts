import type { LogEntry, RegionId, ZoneCount } from './types.js';
import { PORT_PITCH_MM, logsForRegion, zoneDistanceMm } from './zones.js';
import { daysBetween, parseInstant, recencyWeight, wholeDaysBetween } from './time.js';

/**
 * Next-zone recommendation.
 *
 * v1 picked the least-recently-used zone by index. The final report names
 * that as a known limitation: LRU ignores where the zones actually are, so
 * it will happily send you from port 1 to port 2 — legal at 30 mm, but the
 * worst legal choice available.
 *
 * v2 scores every candidate by proximity to recent sites, weighted by how
 * recent those sites are, and picks the one that is furthest from where
 * you have been injecting lately.
 */

/** A site's influence halves every this many days. */
export const RECENCY_HALF_LIFE_DAYS = 14;

/** Sites older than this contribute nothing — keeps the score bounded. */
export const RECENCY_HORIZON_DAYS = 90;

export type RecommendationReason = 'first-injection' | 'unused-zone' | 'furthest-from-recent';

export interface Recommendation {
  /** 0-indexed zone; display as zone + 1. */
  readonly zone: number;
  readonly reason: RecommendationReason;
  /** Whole days since this zone was last used in this region; null if never. */
  readonly restDays: number | null;
  /** Distance from the most recent injection in this region, in mm. */
  readonly separationFromLastMm: number | null;
}

/**
 * Proximity penalty for a candidate sitting `distanceMm` from a past site.
 * 1.0 at the same port, 0.5 one pitch away, tending to 0 across the plate.
 * Bounded, so no special-casing of the zero-distance divide.
 */
function proximityPenalty(distanceMm: number): number {
  return 1 / (1 + distanceMm / PORT_PITCH_MM);
}

interface WeightedSite {
  readonly zone: number;
  readonly weight: number;
}

function weightedRecentSites(
  regionLogs: readonly LogEntry[],
  nowMs: number,
): readonly WeightedSite[] {
  const sites: WeightedSite[] = [];
  for (const log of regionLogs) {
    const ms = parseInstant(log.timestamp);
    if (ms === null) continue;
    const ageDays = daysBetween(ms, nowMs);
    if (ageDays > RECENCY_HORIZON_DAYS) continue;
    sites.push({ zone: log.zone, weight: recencyWeight(ageDays, RECENCY_HALF_LIFE_DAYS) });
  }
  return sites;
}

/** Total weighted proximity cost of injecting at `candidate`. Lower is better. */
function siteCost(candidate: number, sites: readonly WeightedSite[], zoneCount: ZoneCount): number {
  let cost = 0;
  for (const site of sites) {
    cost += site.weight * proximityPenalty(zoneDistanceMm(candidate, site.zone, zoneCount));
  }
  return cost;
}

/** Most recently used zone in this region, or null when there is no history. */
export function lastUsedZone(regionLogs: readonly LogEntry[]): number | null {
  let bestZone: number | null = null;
  let bestMs = Number.NEGATIVE_INFINITY;
  for (const log of regionLogs) {
    const ms = parseInstant(log.timestamp);
    if (ms === null) continue;
    if (ms >= bestMs) {
      bestMs = ms;
      bestZone = log.zone;
    }
  }
  return bestZone;
}

/** Epoch ms of the last use of `zone` in this region, or null. */
export function lastUseOfZone(regionLogs: readonly LogEntry[], zone: number): number | null {
  let best: number | null = null;
  for (const log of regionLogs) {
    if (log.zone !== zone) continue;
    const ms = parseInstant(log.timestamp);
    if (ms === null) continue;
    if (best === null || ms > best) best = ms;
  }
  return best;
}

/**
 * Recommend the next zone for `region`.
 *
 * Guarantees, all covered by property tests:
 *   - the result is always a valid zone index for `zoneCount`
 *   - it is never the most recently used zone (when more than one exists)
 *   - it is deterministic for a given log set and `now`
 */
export function recommendNextZone(
  logs: readonly LogEntry[],
  region: RegionId,
  zoneCount: ZoneCount,
  options: { now?: number } = {},
): Recommendation {
  const nowMs = options.now ?? Date.now();
  const regionLogs = logsForRegion(logs, region, zoneCount);

  if (regionLogs.length === 0) {
    return { zone: 0, reason: 'first-injection', restDays: null, separationFromLastMm: null };
  }

  const mru = lastUsedZone(regionLogs);

  // Never send the user back to the site they just used, whatever the
  // scores say. This is a hard clinical guarantee, not a tie-break.
  // (Every supported guide has at least six ports, so excluding one
  // always leaves a candidate.)
  const candidates: number[] = [];
  for (let z = 0; z < zoneCount; z++) {
    if (z === mru) continue;
    candidates.push(z);
  }

  const sites = weightedRecentSites(regionLogs, nowMs);
  const used = new Set(regionLogs.map((l) => l.zone));

  // Seeded past any real key, so the first candidate always wins the
  // comparison below — every supported guide has at least six ports, so
  // removing the most-recent one always leaves candidates non-empty.
  let best = 0;
  let bestKey: [number, number] = [Infinity, Infinity];

  for (const zone of candidates) {
    // Unused zones sort ahead of used ones; within each group, lowest
    // weighted-proximity cost wins. Ties resolve to the lowest index,
    // which is what makes the function deterministic.
    const key: [number, number] = [used.has(zone) ? 1 : 0, siteCost(zone, sites, zoneCount)];
    if (key[0] < bestKey[0] || (key[0] === bestKey[0] && key[1] < bestKey[1])) {
      best = zone;
      bestKey = key;
    }
  }

  const lastUse = lastUseOfZone(regionLogs, best);
  const separation = mru === null ? null : zoneDistanceMm(best, mru, zoneCount);

  return {
    zone: best,
    reason: used.has(best) ? 'furthest-from-recent' : 'unused-zone',
    restDays: lastUse === null ? null : wholeDaysBetween(lastUse, nowMs),
    separationFromLastMm: separation,
  };
}
