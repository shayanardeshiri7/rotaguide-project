import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  MS_PER_DAY,
  dayKey,
  daysBetween,
  parseInstant,
  recencyWeight,
  wholeDaysBetween,
} from '../time';
import { NOW } from '@/test/factories';

describe('parseInstant', () => {
  it('parses an ISO timestamp', () => {
    expect(parseInstant('2026-04-10T12:00:00.000Z')).toBe(NOW);
  });

  it('returns null rather than NaN for junk', () => {
    expect(parseInstant('not a date')).toBeNull();
    expect(parseInstant('')).toBeNull();
  });
});

describe('daysBetween', () => {
  it('measures elapsed days as a fraction', () => {
    expect(daysBetween(NOW - MS_PER_DAY * 2.5, NOW)).toBeCloseTo(2.5, 10);
  });

  it('clamps a future timestamp to zero instead of going negative', () => {
    // A negative age would invert every recency weight downstream, which
    // would quietly recommend the site the user just injected into.
    expect(daysBetween(NOW + MS_PER_DAY, NOW)).toBe(0);
  });

  it('is never negative', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        expect(daysBetween(a, b)).toBeGreaterThanOrEqual(0);
      }),
    );
  });
});

describe('wholeDaysBetween', () => {
  it('floors the fractional part', () => {
    expect(wholeDaysBetween(NOW - MS_PER_DAY * 2.9, NOW)).toBe(2);
    expect(wholeDaysBetween(NOW, NOW)).toBe(0);
  });
});

describe('recencyWeight', () => {
  it('is 1 at zero age and 0.5 at one half-life', () => {
    expect(recencyWeight(0, 14)).toBe(1);
    expect(recencyWeight(14, 14)).toBeCloseTo(0.5, 10);
    expect(recencyWeight(28, 14)).toBeCloseTo(0.25, 10);
  });

  it('decreases monotonically and stays inside (0, 1]', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0, max: 365, noNaN: true }),
        fc.double({ min: 0, max: 365, noNaN: true }),
        (a, b) => {
          const [younger, older] = a <= b ? [a, b] : [b, a];
          const wYoung = recencyWeight(younger, 14);
          const wOld = recencyWeight(older, 14);
          expect(wYoung).toBeGreaterThanOrEqual(wOld);
          expect(wYoung).toBeLessThanOrEqual(1);
          expect(wOld).toBeGreaterThan(0);
        },
      ),
    );
  });
});

describe('dayKey', () => {
  it('formats a zero-padded local calendar day', () => {
    const key = dayKey(Date.parse('2026-01-05T10:00:00'));
    expect(key).toBe('2026-01-05');
  });

  it('is stable across times within the same local day', () => {
    const morning = Date.parse('2026-06-15T00:30:00');
    const evening = Date.parse('2026-06-15T23:30:00');
    expect(dayKey(morning)).toBe(dayKey(evening));
  });

  it('always produces a YYYY-MM-DD shape', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 2_000_000_000_000 }), (ms) => {
        expect(dayKey(ms)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      }),
    );
  });
});
