import type { LogEntry, RegionId, ZoneCount, ZonePoint } from './types.js';

/**
 * Zone geometry.
 *
 * The app's UI is a radial dial — that is a *metaphor*, and a good one for
 * one-handed phone use. The physical guide it mirrors is a rectangular
 * plate with circular ports in a staggered grid. Distance calculations
 * must use the plate, not the dial: two zones that sit next to each other
 * on the dial are not necessarily adjacent on the body.
 *
 * Measurements below are the as-built V1 plate.
 */

/** Spec floor for spacing between consecutive injection sites (mm). */
export const MIN_SPACING_MM = 20;

/** Centre-to-centre port pitch on the printed plate (mm). Deliberately
 *  conservative — 30 mm against a 20 mm requirement. */
export const PORT_PITCH_MM = 30;

/** Port opening diameter (mm) — clears 4–8 mm pen needles. */
export const PORT_DIAMETER_MM = 10;

interface GridLayout {
  readonly cols: number;
  readonly rows: number;
}

/**
 * Port arrangement per zone count. The 12-zone case is the printed V1
 * plate: four columns, three rows, numbered left-to-right, top-to-bottom
 * (matching the embossed numerals on the prototype).
 */
const GRID_LAYOUTS: Record<ZoneCount, GridLayout> = {
  6: { cols: 3, rows: 2 },
  8: { cols: 4, rows: 2 },
  10: { cols: 5, rows: 2 },
  12: { cols: 4, rows: 3 },
};

export function gridLayout(zoneCount: ZoneCount): GridLayout {
  return GRID_LAYOUTS[zoneCount];
}

/**
 * Centre of a port in region-local millimetres, origin at plate centre.
 * Throws on an out-of-range zone rather than returning a silent default —
 * a bad zone index is a programming error, and quietly mapping it to a
 * real body location is exactly the kind of bug this app cannot have.
 */
export function zonePoint(zone: number, zoneCount: ZoneCount): ZonePoint {
  if (!Number.isInteger(zone) || zone < 0 || zone >= zoneCount) {
    throw new RangeError(`zone ${zone} out of range for a ${zoneCount}-zone guide`);
  }
  const { cols, rows } = GRID_LAYOUTS[zoneCount];
  const col = zone % cols;
  const row = Math.floor(zone / cols);

  // Centre the grid so the origin sits at the middle of the plate.
  const x = (col - (cols - 1) / 2) * PORT_PITCH_MM;
  const y = (row - (rows - 1) / 2) * PORT_PITCH_MM;
  return { x, y };
}

/** Every port centre, in zone order. */
export function allZonePoints(zoneCount: ZoneCount): readonly ZonePoint[] {
  return Array.from({ length: zoneCount }, (_, i) => zonePoint(i, zoneCount));
}

/** Straight-line distance between two ports on the same plate, in mm. */
export function zoneDistanceMm(a: number, b: number, zoneCount: ZoneCount): number {
  const pa = zonePoint(a, zoneCount);
  const pb = zonePoint(b, zoneCount);
  return Math.hypot(pa.x - pb.x, pa.y - pb.y);
}

/**
 * Effective separation between two logged injections, in mm.
 *
 * Different regions are different body areas — an abdomen site and a thigh
 * site are separated by far more than any within-plate distance, so they
 * are reported as Infinity rather than a fabricated number. Returning a
 * made-up centimetre figure would put an unverifiable measurement into a
 * clinical-adjacent calculation.
 */
export function separationMm(a: LogEntry, b: LogEntry, zoneCount: ZoneCount): number {
  if (a.region !== b.region) return Number.POSITIVE_INFINITY;
  return zoneDistanceMm(a.zone, b.zone, zoneCount);
}

/** Whether two consecutive injections respect the >=20 mm spacing spec. */
export function meetsSpacing(a: LogEntry, b: LogEntry, zoneCount: ZoneCount): boolean {
  return separationMm(a, b, zoneCount) >= MIN_SPACING_MM;
}

/** Plate footprint (width x height, mm) for a given zone count. */
export function plateFootprintMm(zoneCount: ZoneCount): { width: number; height: number } {
  const { cols, rows } = GRID_LAYOUTS[zoneCount];
  // One port radius of material beyond the outermost port centres, each side.
  const margin = PORT_DIAMETER_MM;
  return {
    width: (cols - 1) * PORT_PITCH_MM + margin * 2,
    height: (rows - 1) * PORT_PITCH_MM + margin * 2,
  };
}

/** Logs for one region, oldest first, with out-of-range zones dropped. */
export function logsForRegion(
  logs: readonly LogEntry[],
  region: RegionId,
  zoneCount: ZoneCount,
): readonly LogEntry[] {
  return logs.filter(
    (l) => l.region === region && Number.isInteger(l.zone) && l.zone >= 0 && l.zone < zoneCount,
  );
}
