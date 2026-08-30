import type { LogEntry, RegionAdherence, RegionId, ZoneCount } from './types.js';
import { REGION_IDS } from './types.js';
import { MIN_SPACING_MM, separationMm } from './zones.js';
import { dayKey, parseInstant } from './time.js';

/**
 * Rotation adherence.
 *
 * v1 scored a pair as adherent if it differed in zone *or* region — an
 * index comparison that says nothing about how far apart the two sites
 * actually were. v2 measures separation in the plate geometry and scores
 * against the >=20 mm spec the device was designed to.
 */

/** Chronologically sorted copy; entries with unparseable timestamps dropped. */
export function sortByTime(logs: readonly LogEntry[]): readonly LogEntry[] {
  return logs
    .map((log) => ({ log, ms: parseInstant(log.timestamp) }))
    .filter((x): x is { log: LogEntry; ms: number } => x.ms !== null)
    .sort((a, b) => a.ms - b.ms || a.log.id.localeCompare(b.log.id))
    .map((x) => x.log);
}

/**
 * Fraction of consecutive injections separated by at least the spec
 * minimum, in [0, 1]. Returns null when there are fewer than two
 * injections — an adherence score needs a pair to score.
 */
export function calculateAdherence(logs: readonly LogEntry[], zoneCount: ZoneCount): number | null {
  const sorted = sortByTime(logs);
  if (sorted.length < 2) return null;

  let adherent = 0;
  let prev: LogEntry | null = null;
  for (const curr of sorted) {
    if (prev !== null && separationMm(prev, curr, zoneCount) >= MIN_SPACING_MM) adherent++;
    prev = curr;
  }
  return adherent / (sorted.length - 1);
}

/** Adherence as a whole percentage, or null when unscoreable. */
export function adherencePercent(logs: readonly LogEntry[], zoneCount: ZoneCount): number | null {
  const score = calculateAdherence(logs, zoneCount);
  return score === null ? null : Math.round(score * 100);
}

/** Per-region breakdown, in the canonical region order. */
export function adherenceByRegion(
  logs: readonly LogEntry[],
  zoneCount: ZoneCount,
): readonly RegionAdherence[] {
  return REGION_IDS.map((region): RegionAdherence => {
    const regionLogs = logs.filter((l) => l.region === region);
    const score = calculateAdherence(regionLogs, zoneCount);
    return { region, score, pairs: Math.max(0, sortByTime(regionLogs).length - 1) };
  });
}

/**
 * Consecutive calendar days ending today (or yesterday, if nothing has
 * been logged yet today) on which at least one injection was logged.
 *
 * Yesterday is allowed as the anchor so the streak does not visibly reset
 * every morning before the first injection — that read as a bug in v1
 * user testing.
 */
export function calculateStreak(logs: readonly LogEntry[], now: number = Date.now()): number {
  const days = new Set<string>();
  for (const log of logs) {
    const ms = parseInstant(log.timestamp);
    if (ms !== null) days.add(dayKey(ms));
  }
  if (days.size === 0) return 0;

  const MS_PER_DAY = 86_400_000;
  const anchorOffset = days.has(dayKey(now)) ? 0 : 1;
  if (anchorOffset === 1 && !days.has(dayKey(now - MS_PER_DAY))) return 0;

  let streak = 0;
  for (let i = anchorOffset; i < 366; i++) {
    if (!days.has(dayKey(now - i * MS_PER_DAY))) break;
    streak++;
  }
  return streak;
}

/** Injection counts per zone for one region, indexed by zone. */
export function zoneUsageCounts(
  logs: readonly LogEntry[],
  region: RegionId,
  zoneCount: ZoneCount,
): readonly number[] {
  const tally = new Map<number, number>();
  for (const log of logs) {
    if (log.region !== region) continue;
    if (!Number.isInteger(log.zone) || log.zone < 0 || log.zone >= zoneCount) continue;
    tally.set(log.zone, (tally.get(log.zone) ?? 0) + 1);
  }
  return Array.from({ length: zoneCount }, (_, zone) => tally.get(zone) ?? 0);
}

/** Injections per calendar day over the trailing `days` window, oldest first. */
export function dailyCounts(
  logs: readonly LogEntry[],
  days: number,
  now: number = Date.now(),
): readonly { day: string; count: number }[] {
  const MS_PER_DAY = 86_400_000;
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(dayKey(now - i * MS_PER_DAY), 0);
  }
  for (const log of logs) {
    const ms = parseInstant(log.timestamp);
    if (ms === null) continue;
    const key = dayKey(ms);
    const existing = buckets.get(key);
    if (existing !== undefined) buckets.set(key, existing + 1);
  }
  return [...buckets.entries()].map(([day, count]) => ({ day, count }));
}
