import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  MIN_SPACING_MM,
  PORT_PITCH_MM,
  allZonePoints,
  gridLayout,
  logsForRegion,
  meetsSpacing,
  plateFootprintMm,
  separationMm,
  zoneDistanceMm,
  zonePoint,
} from '../zones';
import { ZONE_COUNTS } from '../types';
import type { ZoneCount } from '../types';
import { arbZoneCount, entry } from '@/test/factories';

describe('zonePoint', () => {
  it('lays the 12-zone plate out as 4 columns x 3 rows', () => {
    expect(gridLayout(12)).toEqual({ cols: 4, rows: 3 });
  });

  it('places port 1 top-left and port 12 bottom-right of the printed plate', () => {
    // Numbering matches the numerals embossed on the V1 prototype:
    // left-to-right, top-to-bottom.
    expect(zonePoint(0, 12)).toEqual({ x: -45, y: -30 });
    expect(zonePoint(11, 12)).toEqual({ x: 45, y: 30 });
  });

  it('centres the grid on the origin', () => {
    for (const zoneCount of ZONE_COUNTS) {
      const pts = allZonePoints(zoneCount);
      const sumX = pts.reduce((s, p) => s + p.x, 0);
      const sumY = pts.reduce((s, p) => s + p.y, 0);
      expect(sumX).toBeCloseTo(0, 10);
      expect(sumY).toBeCloseTo(0, 10);
    }
  });

  it('rejects an out-of-range zone rather than guessing a body location', () => {
    expect(() => zonePoint(-1, 12)).toThrow(RangeError);
    expect(() => zonePoint(12, 12)).toThrow(RangeError);
    expect(() => zonePoint(1.5, 12)).toThrow(RangeError);
  });

  it('emits exactly zoneCount points', () => {
    fc.assert(
      fc.property(arbZoneCount, (zoneCount) => {
        expect(allZonePoints(zoneCount)).toHaveLength(zoneCount);
      }),
    );
  });
});

describe('zoneDistanceMm', () => {
  it('is zero to itself and symmetric', () => {
    fc.assert(
      fc.property(arbZoneCount, fc.nat(), fc.nat(), (zoneCount, a, b) => {
        const za = a % zoneCount;
        const zb = b % zoneCount;
        expect(zoneDistanceMm(za, za, zoneCount)).toBe(0);
        expect(zoneDistanceMm(za, zb, zoneCount)).toBeCloseTo(
          zoneDistanceMm(zb, za, zoneCount),
          10,
        );
      }),
    );
  });

  it('separates every distinct pair of ports by at least the spec minimum', () => {
    // This is the property the 30 mm pitch was chosen to guarantee: any
    // two different ports clear the >=20 mm requirement with margin.
    for (const zoneCount of ZONE_COUNTS) {
      for (let a = 0; a < zoneCount; a++) {
        for (let b = 0; b < zoneCount; b++) {
          if (a === b) continue;
          expect(zoneDistanceMm(a, b, zoneCount)).toBeGreaterThanOrEqual(MIN_SPACING_MM);
        }
      }
    }
  });

  it('puts horizontally adjacent ports exactly one pitch apart', () => {
    expect(zoneDistanceMm(0, 1, 12)).toBeCloseTo(PORT_PITCH_MM, 10);
  });

  it('satisfies the triangle inequality', () => {
    fc.assert(
      fc.property(arbZoneCount, fc.nat(), fc.nat(), fc.nat(), (zoneCount, a, b, c) => {
        const [za, zb, zc] = [a % zoneCount, b % zoneCount, c % zoneCount] as const;
        const ab = zoneDistanceMm(za, zb, zoneCount);
        const bc = zoneDistanceMm(zb, zc, zoneCount);
        const ac = zoneDistanceMm(za, zc, zoneCount);
        expect(ac).toBeLessThanOrEqual(ab + bc + 1e-9);
      }),
    );
  });
});

describe('separationMm', () => {
  it('reports different regions as infinitely separated rather than inventing a number', () => {
    const a = entry('abdomen-L', 0, 1);
    const b = entry('thigh-R', 0, 0);
    expect(separationMm(a, b, 12)).toBe(Number.POSITIVE_INFINITY);
    expect(meetsSpacing(a, b, 12)).toBe(true);
  });

  it('fails the spacing check for the same site twice', () => {
    const a = entry('abdomen-L', 3, 1);
    const b = entry('abdomen-L', 3, 0);
    expect(separationMm(a, b, 12)).toBe(0);
    expect(meetsSpacing(a, b, 12)).toBe(false);
  });

  it('passes the spacing check for any two different zones in one region', () => {
    const a = entry('thigh-L', 0, 1);
    const b = entry('thigh-L', 1, 0);
    expect(meetsSpacing(a, b, 12)).toBe(true);
  });
});

describe('plateFootprintMm', () => {
  it('matches the as-built V1 plate footprint', () => {
    // Report gives ~12 cm x 8 cm for the 12-zone V1 plate.
    const { width, height } = plateFootprintMm(12);
    expect(width).toBe(120);
    expect(height).toBe(80);
  });

  it('shrinks as zones are removed', () => {
    const big = plateFootprintMm(12);
    const small = plateFootprintMm(6);
    expect(small.width).toBeLessThan(big.width);
    expect(small.height).toBeLessThan(big.height);
  });
});

describe('logsForRegion', () => {
  it('keeps only the requested region and drops zones outside the guide', () => {
    const logs = [
      entry('abdomen-L', 0, 3),
      entry('thigh-R', 1, 2),
      { ...entry('abdomen-L', 0, 1), zone: 99 },
      { ...entry('abdomen-L', 0, 1), zone: -1 },
      { ...entry('abdomen-L', 0, 1), zone: 2.5 },
      entry('abdomen-L', 5, 0),
    ];
    const kept = logsForRegion(logs, 'abdomen-L', 12 satisfies ZoneCount);
    expect(kept.map((l) => l.zone)).toEqual([0, 5]);
  });
});
