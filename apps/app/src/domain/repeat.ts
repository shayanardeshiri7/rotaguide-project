import type { LogEntry, RegionId, RepeatRisk, ZoneCount } from './types.js';
import { logsForRegion } from './zones.js';
import { sortByTime } from './adherence.js';
import { parseInstant, wholeDaysBetween } from './time.js';

/**
 * Repeat-site risk.
 *
 * Returns a typed state rather than a boolean so the UI renders three
 * distinct treatments — nothing, a soft caution, a blocking warning —
 * instead of an all-or-nothing modal.
 *
 * Wording note: this is an academic prototype, not a medical device. The
 * copy below says what was observed and what the evidence associates with
 * it. It must never claim the app prevents lipohypertrophy or that
 * following it guarantees safe rotation.
 */

/** Uses within the recent window that escalate caution to a warning. */
const WARNING_USE_COUNT = 2;

export function detectRepeatRisk(
  logs: readonly LogEntry[],
  region: RegionId,
  zone: number,
  zoneCount: ZoneCount,
  threshold: number,
  options: { now?: number } = {},
): RepeatRisk {
  const nowMs = options.now ?? Date.now();
  const regionLogs = logsForRegion(logs, region, zoneCount);

  const lastUse = findLastUse(regionLogs, zone, nowMs);
  const window = threshold > 0 ? sortByTime(regionLogs).slice(-threshold) : [];
  const recentUses = window.filter((l) => l.zone === zone).length;

  // `recentUses > 0` implies `lastUse !== null`, but pairing the checks
  // here lets the compiler narrow it for the rest of the function.
  if (recentUses === 0 || lastUse === null) {
    return {
      level: 'none',
      lastUsed: lastUse?.timestamp ?? null,
      daysSince: lastUse?.daysSince ?? null,
      recentUses: 0,
      reason:
        lastUse === null
          ? 'This zone has no recorded use in this region.'
          : `Last used here ${formatDays(lastUse.daysSince)} — outside your last ${threshold} injections.`,
    };
  }

  const level = recentUses >= WARNING_USE_COUNT ? 'warning' : 'caution';
  const reason =
    level === 'warning'
      ? `You have logged this zone ${recentUses} times in your last ${threshold} injections. Repeated use of one site is associated with a higher risk of lipohypertrophy.`
      : `This zone was used within your last ${threshold} injections (${formatDays(
          lastUse.daysSince,
        )}). Spacing sites out is associated with lower lipohypertrophy risk.`;

  return {
    level,
    lastUsed: lastUse.timestamp,
    daysSince: lastUse.daysSince,
    recentUses,
    reason,
  };
}

interface LastUse {
  readonly timestamp: string;
  readonly daysSince: number;
}

/** Most recent use of `zone` in this region, or null if never used. */
function findLastUse(regionLogs: readonly LogEntry[], zone: number, nowMs: number): LastUse | null {
  let bestMs: number | null = null;
  let bestTimestamp = '';

  for (const log of regionLogs) {
    if (log.zone !== zone) continue;
    const ms = parseInstant(log.timestamp);
    if (ms === null) continue;
    if (bestMs === null || ms > bestMs) {
      bestMs = ms;
      bestTimestamp = log.timestamp;
    }
  }

  if (bestMs === null) return null;
  return { timestamp: bestTimestamp, daysSince: wholeDaysBetween(bestMs, nowMs) };
}

function formatDays(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export interface RepeatAlert {
  readonly region: RegionId;
  readonly zone: number;
  readonly count: number;
  readonly windowSize: number;
}

/**
 * Sites used three or more times across the recent window — surfaced on
 * the Insights tab. Sorted most-used first, then by region and zone so
 * the list is stable between renders.
 */
export function findRepeatAlerts(
  logs: readonly LogEntry[],
  zoneCount: ZoneCount,
  threshold: number,
): readonly RepeatAlert[] {
  const windowSize = Math.max(0, threshold * 2);
  const window = sortByTime(logs).slice(-windowSize);

  // Keyed by site, but carrying the region and zone along so they never
  // have to be parsed back out of the key.
  const tally = new Map<string, { region: RegionId; zone: number; count: number }>();
  for (const log of window) {
    if (!Number.isInteger(log.zone) || log.zone < 0 || log.zone >= zoneCount) continue;
    const key = `${log.region}#${log.zone}`;
    const existing = tally.get(key);
    if (existing === undefined) {
      tally.set(key, { region: log.region, zone: log.zone, count: 1 });
    } else {
      existing.count += 1;
    }
  }

  const alerts: RepeatAlert[] = [];
  for (const site of tally.values()) {
    if (site.count < 3) continue;
    alerts.push({
      region: site.region,
      zone: site.zone,
      count: site.count,
      windowSize: window.length,
    });
  }

  return alerts.sort(
    (a, b) => b.count - a.count || a.region.localeCompare(b.region) || a.zone - b.zone,
  );
}
