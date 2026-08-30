/**
 * Domain types for RotaGuide.
 *
 * This module — and everything else under `src/domain` — is pure:
 * no React, no DOM, no I/O, no clock reads except through an injected
 * `now`. That constraint is enforced by ESLint (see eslint.config.js)
 * and is what makes 100% unit coverage achievable.
 */

export const REGION_IDS = [
  'abdomen-L',
  'abdomen-R',
  'thigh-L',
  'thigh-R',
  'arm-L',
  'arm-R',
] as const;

export type RegionId = (typeof REGION_IDS)[number];

export interface Region {
  readonly id: RegionId;
  readonly label: string;
  /** Broad body area — two regions in the same area are still distinct sites. */
  readonly area: 'abdomen' | 'thigh' | 'arm';
  readonly side: 'L' | 'R';
}

export const REGIONS: readonly Region[] = [
  { id: 'abdomen-L', label: 'Abdomen L', area: 'abdomen', side: 'L' },
  { id: 'abdomen-R', label: 'Abdomen R', area: 'abdomen', side: 'R' },
  { id: 'thigh-L', label: 'Thigh L', area: 'thigh', side: 'L' },
  { id: 'thigh-R', label: 'Thigh R', area: 'thigh', side: 'R' },
  { id: 'arm-L', label: 'Arm L', area: 'arm', side: 'L' },
  { id: 'arm-R', label: 'Arm R', area: 'arm', side: 'R' },
];

/** Zone counts the guide supports. 12 matches the printed V1 plate. */
export const ZONE_COUNTS = [6, 8, 10, 12] as const;
export type ZoneCount = (typeof ZONE_COUNTS)[number];

export interface LogEntry {
  readonly id: string;
  readonly region: RegionId;
  /** 0-indexed internally; displayed to the user as zone + 1. */
  readonly zone: number;
  /** ISO 8601 instant. */
  readonly timestamp: string;
}

/** A port centre in region-local millimetres, origin at the plate centre. */
export interface ZonePoint {
  readonly x: number;
  readonly y: number;
}

/** Escalating repeat-site risk. The UI renders a state, never a boolean. */
export type RiskLevel = 'none' | 'caution' | 'warning';

export interface RepeatRisk {
  readonly level: RiskLevel;
  /** ISO timestamp of the most recent use of this exact site, if any. */
  readonly lastUsed: string | null;
  /** Whole days since that use; null when never used. */
  readonly daysSince: number | null;
  /** How many of the last `threshold` injections landed on this site. */
  readonly recentUses: number;
  /** Plain-language explanation, safe to render directly. */
  readonly reason: string;
}

export interface RegionAdherence {
  readonly region: RegionId;
  readonly score: number | null;
  readonly pairs: number;
}

export function isRegionId(value: unknown): value is RegionId {
  return typeof value === 'string' && (REGION_IDS as readonly string[]).includes(value);
}

export function isZoneCount(value: unknown): value is ZoneCount {
  return typeof value === 'number' && (ZONE_COUNTS as readonly number[]).includes(value);
}

export function regionLabel(id: RegionId): string {
  return REGIONS.find((r) => r.id === id)?.label ?? id;
}
