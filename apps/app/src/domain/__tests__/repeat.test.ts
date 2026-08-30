import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import { detectRepeatRisk, findRepeatAlerts } from '../repeat';
import { NOW, arbLogs, arbZoneCount, entries, entry } from '@/test/factories';

describe('detectRepeatRisk', () => {
  it('reports no risk for a zone never used in this region', () => {
    const risk = detectRepeatRisk([], 'abdomen-L', 3, 12, 5, { now: NOW });
    expect(risk.level).toBe('none');
    expect(risk.lastUsed).toBeNull();
    expect(risk.daysSince).toBeNull();
    expect(risk.recentUses).toBe(0);
    expect(risk.reason).toMatch(/no recorded use/i);
  });

  it('cautions on a single use inside the window', () => {
    const logs = entries('abdomen-L', [
      [3, 2],
      [7, 1],
    ]);
    const risk = detectRepeatRisk(logs, 'abdomen-L', 3, 12, 5, { now: NOW });
    expect(risk.level).toBe('caution');
    expect(risk.recentUses).toBe(1);
    expect(risk.daysSince).toBe(2);
  });

  it('escalates to a warning at two uses inside the window', () => {
    const logs = entries('abdomen-L', [
      [3, 4],
      [8, 3],
      [3, 1],
    ]);
    const risk = detectRepeatRisk(logs, 'abdomen-L', 3, 12, 5, { now: NOW });
    expect(risk.level).toBe('warning');
    expect(risk.recentUses).toBe(2);
  });

  it('clears once the use falls outside the recent window', () => {
    // Zone 3 used first, then five other injections push it out of a
    // 5-injection window.
    const logs = entries('abdomen-L', [
      [3, 10],
      [0, 5],
      [4, 4],
      [7, 3],
      [9, 2],
      [11, 1],
    ]);
    const risk = detectRepeatRisk(logs, 'abdomen-L', 3, 12, 5, { now: NOW });
    expect(risk.level).toBe('none');
    expect(risk.recentUses).toBe(0);
    // It still reports when the site was last used — "no risk" is not
    // the same as "no history".
    expect(risk.lastUsed).not.toBeNull();
    expect(risk.daysSince).toBe(10);
    expect(risk.reason).toMatch(/10 days ago/);
  });

  it('does not count uses in a different region', () => {
    const logs = entries('thigh-R', [
      [3, 1],
      [3, 0],
    ]);
    expect(detectRepeatRisk(logs, 'abdomen-L', 3, 12, 5, { now: NOW }).level).toBe('none');
  });

  it('phrases same-day and previous-day uses in plain language', () => {
    const today = detectRepeatRisk(entries('abdomen-L', [[2, 0]]), 'abdomen-L', 2, 12, 5, {
      now: NOW,
    });
    expect(today.reason).toMatch(/today/);

    const yesterday = detectRepeatRisk(entries('abdomen-L', [[2, 1]]), 'abdomen-L', 2, 12, 5, {
      now: NOW,
    });
    expect(yesterday.reason).toMatch(/yesterday/);
  });

  it('treats a zero threshold as an empty window', () => {
    const logs = entries('abdomen-L', [[3, 0]]);
    const risk = detectRepeatRisk(logs, 'abdomen-L', 3, 12, 0, { now: NOW });
    expect(risk.level).toBe('none');
    expect(risk.recentUses).toBe(0);
  });

  it('never claims the app prevents lipohypertrophy', () => {
    // Ethical Failure #1 in the project's own analysis is false
    // reassurance. These words are banned from user-facing copy.
    const banned = /\b(ensure|ensures|prevent|prevents|guarantee|guarantees|safe from)\b/i;
    fc.assert(
      fc.property(
        arbZoneCount.chain((zc) =>
          fc.tuple(fc.constant(zc), arbLogs(zc, 20), fc.integer({ min: 0, max: zc - 1 })),
        ),
        fc.integer({ min: 0, max: 10 }),
        ([zoneCount, logs, zone], threshold) => {
          const risk = detectRepeatRisk(
            logs,
            'abdomen-L',
            zone,
            zoneCount,
            threshold,
            { now: NOW },
          );
          expect(risk.reason).not.toMatch(banned);
        },
      ),
      { numRuns: 150 },
    );
  });

  it('always returns one of the three defined levels', () => {
    fc.assert(
      fc.property(
        arbZoneCount.chain((zc) =>
          fc.tuple(fc.constant(zc), arbLogs(zc), fc.integer({ min: 0, max: zc - 1 })),
        ),
        ([zoneCount, logs, zone]) => {
          const risk = detectRepeatRisk(logs, 'thigh-L', zone, zoneCount, 5, { now: NOW });
          expect(['none', 'caution', 'warning']).toContain(risk.level);
          expect(risk.recentUses).toBeGreaterThanOrEqual(0);
        },
      ),
    );
  });

  it('ignores entries with unparseable timestamps', () => {
    const logs = [{ id: 'x', region: 'abdomen-L' as const, zone: 3, timestamp: 'nope' }];
    expect(detectRepeatRisk(logs, 'abdomen-L', 3, 12, 5, { now: NOW }).level).toBe('none');
  });
});

describe('findRepeatAlerts', () => {
  it('is empty when no site repeats three times', () => {
    const logs = entries('abdomen-L', [
      [0, 3],
      [1, 2],
      [0, 1],
    ]);
    expect(findRepeatAlerts(logs, 12, 5)).toEqual([]);
  });

  it('flags a site used three times in the window', () => {
    const logs = entries('abdomen-L', [
      [4, 5],
      [4, 4],
      [1, 3],
      [4, 2],
    ]);
    const alerts = findRepeatAlerts(logs, 12, 5);
    expect(alerts).toHaveLength(1);
    expect(alerts[0]?.region).toBe('abdomen-L');
    expect(alerts[0]?.zone).toBe(4);
    expect(alerts[0]?.count).toBe(3);
  });

  it('keeps regions separate', () => {
    const logs = [
      ...entries('abdomen-L', [
        [4, 6],
        [4, 5],
      ]),
      ...entries('thigh-R', [[4, 4]]),
    ];
    expect(findRepeatAlerts(logs, 12, 5)).toEqual([]);
  });

  it('sorts most-used first and is stable on ties', () => {
    const logs = [
      ...entries('abdomen-L', [
        [1, 12],
        [1, 11],
        [1, 10],
        [1, 9],
      ]),
      ...entries('thigh-L', [
        [2, 8],
        [2, 7],
        [2, 6],
      ]),
    ];
    const alerts = findRepeatAlerts(logs, 12, 8);
    expect(alerts.map((a) => a.count)).toEqual([4, 3]);
    expect(alerts[0]?.region).toBe('abdomen-L');
  });

  it('drops zones outside the current guide size', () => {
    const logs = [0, 1, 2].map(() => ({ ...entry('abdomen-L', 0, 1), zone: 11 }));
    expect(findRepeatAlerts(logs, 6, 5)).toEqual([]);
  });

  it('handles a zero threshold without throwing', () => {
    expect(findRepeatAlerts(entries('abdomen-L', [[0, 0]]), 12, 0)).toEqual([]);
  });

  it('never reports a count above the window size', () => {
    fc.assert(
      fc.property(
        arbZoneCount.chain((zc) => fc.tuple(fc.constant(zc), arbLogs(zc))),
        fc.integer({ min: 0, max: 10 }),
        ([zoneCount, logs], threshold) => {
          for (const alert of findRepeatAlerts(logs, zoneCount, threshold)) {
            expect(alert.count).toBeLessThanOrEqual(alert.windowSize);
            expect(alert.count).toBeGreaterThanOrEqual(3);
          }
        },
      ),
    );
  });
});

describe('branch coverage for repeat internals', () => {
  it('takes the newest use when a zone was logged several times', () => {
    // Exercises the "newer than the best so far" comparison in both
    // directions: the array is deliberately not in chronological order.
    const logs = entries('abdomen-L', [
      [2, 9],
      [2, 1],
      [2, 5],
    ]);
    const risk = detectRepeatRisk(logs, 'abdomen-L', 2, 12, 5, { now: NOW });
    expect(risk.daysSince).toBe(1);
  });

  it('reports no history when every timestamp for the zone is unparseable', () => {
    const logs = [
      { id: 'a', region: 'abdomen-L' as const, zone: 6, timestamp: 'nope' },
      { id: 'b', region: 'abdomen-L' as const, zone: 6, timestamp: 'also nope' },
    ];
    const risk = detectRepeatRisk(logs, 'abdomen-L', 6, 12, 5, { now: NOW });
    expect(risk.level).toBe('none');
    expect(risk.lastUsed).toBeNull();
    expect(risk.daysSince).toBeNull();
  });

  it('breaks alert ties by region, then by zone', () => {
    const logs = [
      ...entries('thigh-L', [
        [5, 20],
        [5, 19],
        [5, 18],
      ]),
      ...entries('abdomen-L', [
        [9, 17],
        [9, 16],
        [9, 15],
      ]),
      ...entries('abdomen-L', [
        [1, 14],
        [1, 13],
        [1, 12],
      ]),
    ];
    const alerts = findRepeatAlerts(logs, 12, 12);
    expect(alerts.map((a) => `${a.region}:${a.zone}`)).toEqual([
      'abdomen-L:1',
      'abdomen-L:9',
      'thigh-L:5',
    ]);
  });
});
