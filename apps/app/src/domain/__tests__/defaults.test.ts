import { afterEach, describe, expect, it, vi } from 'vitest';
import { recommendNextZone } from '../recommend';
import { detectRepeatRisk } from '../repeat';
import { calculateStreak, dailyCounts } from '../adherence';
import { NOW, entries } from '@/test/factories';

/**
 * The domain layer never reads the clock implicitly *during* a
 * calculation, but the public entry points do accept an optional `now`
 * that defaults to the current time. These cover that default path, so
 * the app can call them without threading a clock through every layer.
 */
describe('default clock', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('recommendNextZone falls back to the current time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const logs = entries('abdomen-L', [[0, 0]]);
    expect(recommendNextZone(logs, 'abdomen-L', 12)).toEqual(
      recommendNextZone(logs, 'abdomen-L', 12, { now: NOW }),
    );
  });

  it('detectRepeatRisk falls back to the current time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const logs = entries('abdomen-L', [[3, 1]]);
    expect(detectRepeatRisk(logs, 'abdomen-L', 3, 12, 5)).toEqual(
      detectRepeatRisk(logs, 'abdomen-L', 3, 12, 5, { now: NOW }),
    );
  });

  it('calculateStreak falls back to the current time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const logs = entries('abdomen-L', [[0, 0]]);
    expect(calculateStreak(logs)).toBe(calculateStreak(logs, NOW));
  });

  it('dailyCounts falls back to the current time', () => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    const logs = entries('abdomen-L', [[0, 0]]);
    expect(dailyCounts(logs, 7)).toEqual(dailyCounts(logs, 7, NOW));
  });
});
