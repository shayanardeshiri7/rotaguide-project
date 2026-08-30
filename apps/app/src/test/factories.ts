import fc from 'fast-check';
import { REGION_IDS, ZONE_COUNTS } from '@/domain/types';
import type { LogEntry, RegionId, ZoneCount } from '@/domain/types';

/** Fixed reference instant so every test is deterministic. */
export const NOW = Date.parse('2026-04-10T12:00:00.000Z');
export const DAY = 86_400_000;

let seq = 0;

/** Build one log entry `daysAgo` days before NOW. */
export function entry(
  region: RegionId,
  zone: number,
  daysAgo: number,
  now: number = NOW,
): LogEntry {
  seq += 1;
  return {
    id: `e${seq}`,
    region,
    zone,
    timestamp: new Date(now - daysAgo * DAY).toISOString(),
  };
}

/** Build a run of entries from [zone, daysAgo] pairs, oldest first. */
export function entries(
  region: RegionId,
  pairs: readonly (readonly [number, number])[],
): LogEntry[] {
  return pairs.map(([zone, daysAgo]) => entry(region, zone, daysAgo));
}

export const arbRegion = fc.constantFrom<RegionId>(...REGION_IDS);
export const arbZoneCount = fc.constantFrom<ZoneCount>(...ZONE_COUNTS);

/** Arbitrary log entries valid for a given zone count. */
export function arbLogs(zoneCount: ZoneCount, maxLength = 40): fc.Arbitrary<LogEntry[]> {
  return fc.array(
    fc.record({
      id: fc.uuid(),
      region: arbRegion,
      zone: fc.integer({ min: 0, max: zoneCount - 1 }),
      // Anywhere in the trailing year.
      timestamp: fc
        .integer({ min: 0, max: 365 * 24 * 60 })
        .map((minsAgo) => new Date(NOW - minsAgo * 60_000).toISOString()),
    }),
    { maxLength },
  );
}
