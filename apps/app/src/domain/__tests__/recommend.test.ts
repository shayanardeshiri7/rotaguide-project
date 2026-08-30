import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { lastUseOfZone, lastUsedZone, recommendNextZone } from '../recommend';
import { zoneDistanceMm } from '../zones';

import { NOW, arbLogs, arbZoneCount, entries, entry } from '@/test/factories';

describe('recommendNextZone', () => {
  it('starts a fresh region at zone 1', () => {
    const rec = recommendNextZone([], 'abdomen-L', 12, { now: NOW });
    expect(rec).toEqual({
      zone: 0,
      reason: 'first-injection',
      restDays: null,
      separationFromLastMm: null,
    });
  });

  it('ignores history from other regions', () => {
    const logs = entries('thigh-R', [
      [0, 3],
      [1, 2],
    ]);
    expect(recommendNextZone(logs, 'abdomen-L', 12, { now: NOW }).reason).toBe('first-injection');
  });

  it('prefers an unused zone over a rested one', () => {
    // Zone 0 was used a year ago; zones 1..11 are untouched. An unused
    // site should still win.
    const logs = entries('abdomen-L', [[0, 300]]);
    const rec = recommendNextZone(logs, 'abdomen-L', 12, { now: NOW });
    expect(rec.reason).toBe('unused-zone');
    expect(rec.restDays).toBeNull();
  });

  it('moves away from the corner just used, not merely one port along', () => {
    // This is the v1 limitation the report calls out: LRU would offer
    // zone 2 (30 mm away). The upgraded scorer should pick something
    // genuinely distant on the plate.
    const logs = entries('abdomen-L', [[0, 0]]);
    const rec = recommendNextZone(logs, 'abdomen-L', 12, { now: NOW });
    expect(rec.zone).not.toBe(1);
    expect(rec.separationFromLastMm ?? 0).toBeGreaterThan(zoneDistanceMm(0, 1, 12));
    // Opposite corner of the 4x3 plate.
    expect(rec.zone).toBe(11);
  });

  it('once every zone is used, returns the best-rested distant site', () => {
    // All 12 used; zone 0 used longest ago but sits beside recent activity.
    const logs = entries('abdomen-L', [
      [0, 60],
      [1, 12],
      [2, 11],
      [3, 10],
      [4, 9],
      [5, 8],
      [6, 7],
      [7, 6],
      [8, 5],
      [9, 4],
      [10, 3],
      [11, 1],
    ]);
    const rec = recommendNextZone(logs, 'abdomen-L', 12, { now: NOW });
    expect(rec.reason).toBe('furthest-from-recent');
    expect(rec.restDays).not.toBeNull();
    expect(rec.zone).not.toBe(11);
  });

  it('tolerates unparseable timestamps instead of throwing', () => {
    const logs = [
      { id: 'bad', region: 'abdomen-L' as const, zone: 3, timestamp: 'not-a-date' },
      entry('abdomen-L', 5, 0),
    ];
    const rec = recommendNextZone(logs, 'abdomen-L', 12, { now: NOW });
    expect(rec.zone).toBeGreaterThanOrEqual(0);
    expect(rec.zone).toBeLessThan(12);
  });

  it('forgets sites beyond the recency horizon', () => {
    const ancient = entries('abdomen-L', [[11, 400]]);
    const rec = recommendNextZone(ancient, 'abdomen-L', 12, { now: NOW });
    // The 400-day-old entry still counts as "used", but contributes no
    // proximity cost, so an unused zone wins.
    expect(rec.reason).toBe('unused-zone');
  });

  // ── Invariants ──

  it('never recommends the most recently used zone', () => {
    fc.assert(
      fc.property(
        arbZoneCount.chain((zc) =>
          fc.tuple(
            fc.constant(zc),
            arbLogs(zc, 30).filter((l) => l.length > 0),
          ),
        ),
        ([zoneCount, logs]) => {
          for (const region of ['abdomen-L', 'thigh-R', 'arm-L'] as const) {
            const regionLogs = logs.filter((l) => l.region === region);
            if (regionLogs.length === 0) continue;
            const mru = lastUsedZone(regionLogs);
            const rec = recommendNextZone(logs, region, zoneCount, { now: NOW });
            expect(rec.zone).not.toBe(mru);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('always returns a valid zone index', () => {
    fc.assert(
      fc.property(
        arbZoneCount.chain((zc) => fc.tuple(fc.constant(zc), arbLogs(zc))),
        ([zoneCount, logs]) => {
          const rec = recommendNextZone(logs, 'abdomen-L', zoneCount, { now: NOW });
          expect(Number.isInteger(rec.zone)).toBe(true);
          expect(rec.zone).toBeGreaterThanOrEqual(0);
          expect(rec.zone).toBeLessThan(zoneCount);
        },
      ),
    );
  });

  it('is deterministic for a given log set and clock', () => {
    fc.assert(
      fc.property(
        arbZoneCount.chain((zc) => fc.tuple(fc.constant(zc), arbLogs(zc))),
        ([zoneCount, logs]) => {
          const a = recommendNextZone(logs, 'thigh-L', zoneCount, { now: NOW });
          const b = recommendNextZone(logs, 'thigh-L', zoneCount, { now: NOW });
          expect(a).toEqual(b);
        },
      ),
    );
  });

  it('is unaffected by the order logs are stored in', () => {
    fc.assert(
      fc.property(
        arbZoneCount.chain((zc) => fc.tuple(fc.constant(zc), arbLogs(zc, 20))),
        ([zoneCount, logs]) => {
          const reversed = [...logs].reverse();
          expect(recommendNextZone(reversed, 'arm-R', zoneCount, { now: NOW }).zone).toBe(
            recommendNextZone(logs, 'arm-R', zoneCount, { now: NOW }).zone,
          );
        },
      ),
    );
  });
});

describe('lastUsedZone / lastUseOfZone', () => {
  it('returns null for empty history', () => {
    expect(lastUsedZone([])).toBeNull();
    expect(lastUseOfZone([], 0)).toBeNull();
  });

  it('finds the newest entry regardless of array order', () => {
    const logs = entries('abdomen-L', [
      [4, 0],
      [7, 5],
      [2, 9],
    ]);
    expect(lastUsedZone(logs)).toBe(4);
  });

  it('skips entries with unparseable timestamps', () => {
    const logs = [
      { id: 'x', region: 'abdomen-L' as const, zone: 9, timestamp: 'nope' },
      entry('abdomen-L', 2, 1),
    ];
    expect(lastUsedZone(logs)).toBe(2);
    expect(lastUseOfZone(logs, 9)).toBeNull();
    expect(lastUseOfZone(logs, 2)).not.toBeNull();
  });

  it('returns the most recent use when a zone was used repeatedly', () => {
    const logs = entries('abdomen-L', [
      [3, 10],
      [3, 2],
      [3, 6],
    ]);
    const ms = lastUseOfZone(logs, 3);
    expect(ms).toBe(Date.parse(new Date(NOW - 2 * 86_400_000).toISOString()));
  });
});

describe('recommendNextZone with no usable history', () => {
  it('treats an all-unparseable region as having no most-recent zone', () => {
    // Every entry survives the region filter but none carries a readable
    // instant, so there is no site to steer away from.
    const logs = [
      { id: 'a', region: 'abdomen-L' as const, zone: 4, timestamp: 'nope' },
      { id: 'b', region: 'abdomen-L' as const, zone: 7, timestamp: 'nope either' },
    ];
    const rec = recommendNextZone(logs, 'abdomen-L', 12, { now: NOW });
    expect(rec.separationFromLastMm).toBeNull();
    expect(rec.restDays).toBeNull();
    expect(rec.reason).toBe('unused-zone');
    expect(rec.zone).toBe(0);
  });
});
