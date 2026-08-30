import { describe, expect, it } from 'vitest';
import { REGIONS, REGION_IDS, ZONE_COUNTS, isRegionId, isZoneCount, regionLabel } from '../types';

describe('region model', () => {
  it('covers six regions across three body areas, left and right', () => {
    expect(REGION_IDS).toHaveLength(6);
    expect(REGIONS).toHaveLength(6);
    expect(new Set(REGIONS.map((r) => r.area))).toEqual(new Set(['abdomen', 'thigh', 'arm']));
    expect(REGIONS.filter((r) => r.side === 'L')).toHaveLength(3);
  });

  it('keeps REGIONS and REGION_IDS in the same order', () => {
    expect(REGIONS.map((r) => r.id)).toEqual([...REGION_IDS]);
  });
});

describe('isRegionId', () => {
  it('accepts known regions and rejects everything else', () => {
    expect(isRegionId('abdomen-L')).toBe(true);
    expect(isRegionId('abdomen-X')).toBe(false);
    expect(isRegionId(42)).toBe(false);
    expect(isRegionId(null)).toBe(false);
    expect(isRegionId(undefined)).toBe(false);
  });
});

describe('isZoneCount', () => {
  it('accepts only the supported guide sizes', () => {
    for (const n of ZONE_COUNTS) expect(isZoneCount(n)).toBe(true);
    expect(isZoneCount(7)).toBe(false);
    expect(isZoneCount('12')).toBe(false);
    expect(isZoneCount(null)).toBe(false);
  });
});

describe('regionLabel', () => {
  it('returns the human label', () => {
    expect(regionLabel('thigh-R')).toBe('Thigh R');
  });

  it('falls back to the id for an unknown region rather than rendering undefined', () => {
    expect(regionLabel('nowhere' as never)).toBe('nowhere');
  });
});
