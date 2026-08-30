import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  adherenceByRegion,
  adherencePercent,
  calculateAdherence,
  calculateStreak,
  dailyCounts,
  sortByTime,
  zoneUsageCounts,
} from '../adherence';
import { NOW, arbLogs, arbZoneCount, entries, entry } from '@/test/factories';

describe('calculateAdherence', () => {
  it('is null below two injections', () => {
    expect(calculateAdherence([], 12)).toBeNull();
    expect(calculateAdherence([entry('abdomen-L', 0, 0)], 12)).toBeNull();
  });

  it('scores a perfect rotation at 1', () => {
    const logs = entries('abdomen-L', [
      [0, 4],
      [6, 3],
      [3, 2],
      [9, 1],
    ]);
    expect(calculateAdherence(logs, 12)).toBe(1);
  });

  it('scores repeated use of one site at 0', () => {
    const logs = entries('abdomen-L', [
      [5, 3],
      [5, 2],
      [5, 1],
    ]);
    expect(calculateAdherence(logs, 12)).toBe(0);
  });

  it('counts a region change as adequately separated', () => {
    const logs = [entry('abdomen-L', 5, 2), entry('thigh-R', 5, 1)];
    expect(calculateAdherence(logs, 12)).toBe(1);
  });

  it('scores by chronology, not array order', () => {
    const chronological = entries('abdomen-L', [
      [0, 3],
      [0, 2],
      [7, 1],
    ]);
    const shuffled = [chronological[2]!, chronological[0]!, chronological[1]!];
    expect(calculateAdherence(shuffled, 12)).toBe(calculateAdherence(chronological, 12));
    // one bad pair (0 -> 0), one good pair (0 -> 7)
    expect(calculateAdherence(chronological, 12)).toBeCloseTo(0.5, 10);
  });

  it('drops entries with unparseable timestamps', () => {
    const logs = [
      entry('abdomen-L', 0, 2),
      { id: 'bad', region: 'abdomen-L' as const, zone: 4, timestamp: 'garbage' },
      entry('abdomen-L', 6, 1),
    ];
    expect(calculateAdherence(logs, 12)).toBe(1);
  });

  it('always lands in [0, 1]', () => {
    fc.assert(
      fc.property(
        arbZoneCount.chain((zc) => fc.tuple(fc.constant(zc), arbLogs(zc))),
        ([zoneCount, logs]) => {
          const score = calculateAdherence(logs, zoneCount);
          if (score === null) return;
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(1);
        },
      ),
    );
  });
});

describe('adherencePercent', () => {
  it('rounds to a whole percentage', () => {
    const logs = entries('abdomen-L', [
      [0, 4],
      [0, 3],
      [1, 2],
      [8, 1],
    ]);
    expect(adherencePercent(logs, 12)).toBe(67);
  });

  it('is null when unscoreable', () => {
    expect(adherencePercent([], 12)).toBeNull();
  });
});

describe('adherenceByRegion', () => {
  it('reports every region in canonical order, scoring each independently', () => {
    const logs = [
      ...entries('abdomen-L', [
        [0, 4],
        [7, 3],
      ]),
      ...entries('thigh-R', [
        [2, 2],
        [2, 1],
      ]),
    ];
    const rows = adherenceByRegion(logs, 12);
    expect(rows).toHaveLength(6);
    expect(rows[0]).toEqual({ region: 'abdomen-L', score: 1, pairs: 1 });
    expect(rows.find((r) => r.region === 'thigh-R')).toEqual({
      region: 'thigh-R',
      score: 0,
      pairs: 1,
    });
    expect(rows.find((r) => r.region === 'arm-L')).toEqual({
      region: 'arm-L',
      score: null,
      pairs: 0,
    });
  });
});

describe('calculateStreak', () => {
  it('is zero with no logs', () => {
    expect(calculateStreak([], NOW)).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const logs = entries('abdomen-L', [
      [0, 2],
      [1, 1],
      [2, 0],
    ]);
    expect(calculateStreak(logs, NOW)).toBe(3);
  });

  it('still counts the streak before the first injection of the day', () => {
    // Nothing logged today yet — anchoring on yesterday stops the number
    // visibly resetting every morning, which read as a bug in v1 testing.
    const logs = entries('abdomen-L', [
      [0, 3],
      [1, 2],
      [2, 1],
    ]);
    expect(calculateStreak(logs, NOW)).toBe(3);
  });

  it('breaks on a gap', () => {
    const logs = entries('abdomen-L', [
      [0, 5],
      [1, 4],
      [2, 0],
    ]);
    expect(calculateStreak(logs, NOW)).toBe(1);
  });

  it('is zero when the newest entry is older than yesterday', () => {
    expect(calculateStreak(entries('abdomen-L', [[0, 9]]), NOW)).toBe(0);
  });

  it('counts a day once no matter how many injections it holds', () => {
    const logs = entries('abdomen-L', [
      [0, 0],
      [4, 0],
      [8, 0],
    ]);
    expect(calculateStreak(logs, NOW)).toBe(1);
  });

  it('ignores unparseable timestamps', () => {
    const logs = [{ id: 'z', region: 'abdomen-L' as const, zone: 0, timestamp: '??' }];
    expect(calculateStreak(logs, NOW)).toBe(0);
  });

  it('is never negative and never exceeds a year', () => {
    fc.assert(
      fc.property(arbLogs(12), (logs) => {
        const streak = calculateStreak(logs, NOW);
        expect(streak).toBeGreaterThanOrEqual(0);
        expect(streak).toBeLessThanOrEqual(366);
      }),
    );
  });
});

describe('zoneUsageCounts', () => {
  it('counts per zone for one region only', () => {
    const logs = [
      ...entries('abdomen-L', [
        [0, 3],
        [0, 2],
        [5, 1],
      ]),
      ...entries('thigh-R', [[0, 1]]),
    ];
    const counts = zoneUsageCounts(logs, 'abdomen-L', 12);
    expect(counts).toHaveLength(12);
    expect(counts[0]).toBe(2);
    expect(counts[5]).toBe(1);
    expect(counts[7]).toBe(0);
  });

  it('drops zones outside the current guide size', () => {
    const logs = [{ ...entry('abdomen-L', 0, 1), zone: 11 }];
    expect(zoneUsageCounts(logs, 'abdomen-L', 6).reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('total never exceeds the number of logs', () => {
    fc.assert(
      fc.property(
        arbZoneCount.chain((zc) => fc.tuple(fc.constant(zc), arbLogs(zc))),
        ([zoneCount, logs]) => {
          const total = zoneUsageCounts(logs, 'abdomen-L', zoneCount).reduce((a, b) => a + b, 0);
          expect(total).toBeLessThanOrEqual(logs.length);
        },
      ),
    );
  });
});

describe('dailyCounts', () => {
  it('returns one bucket per day, oldest first', () => {
    const buckets = dailyCounts(entries('abdomen-L', [[0, 0]]), 7, NOW);
    expect(buckets).toHaveLength(7);
    expect(buckets.at(-1)?.count).toBe(1);
    expect(buckets[0]?.count).toBe(0);
  });

  it('ignores entries outside the window', () => {
    const logs = entries('abdomen-L', [
      [0, 40],
      [1, 1],
    ]);
    const total = dailyCounts(logs, 7, NOW).reduce((s, b) => s + b.count, 0);
    expect(total).toBe(1);
  });

  it('ignores unparseable timestamps', () => {
    const logs = [{ id: 'q', region: 'abdomen-L' as const, zone: 0, timestamp: 'x' }];
    expect(dailyCounts(logs, 7, NOW).reduce((s, b) => s + b.count, 0)).toBe(0);
  });
});

describe('sortByTime', () => {
  it('orders oldest first and breaks ties on id for stability', () => {
    const same = new Date(NOW).toISOString();
    const logs = [
      { id: 'b', region: 'abdomen-L' as const, zone: 1, timestamp: same },
      { id: 'a', region: 'abdomen-L' as const, zone: 2, timestamp: same },
    ];
    expect(sortByTime(logs).map((l) => l.id)).toEqual(['a', 'b']);
  });

  it('does not mutate its input', () => {
    const logs = entries('abdomen-L', [
      [0, 1],
      [1, 5],
    ]);
    const snapshot = [...logs];
    sortByTime(logs);
    expect(logs).toEqual(snapshot);
  });
});
