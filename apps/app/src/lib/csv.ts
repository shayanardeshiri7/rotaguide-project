import type { LogEntry, ZoneCount } from '@/domain/types';
import { regionLabel } from '@/domain/types';
import { sortByTime } from '@/domain/adherence';
import { separationMm } from '@/domain/zones';
import { formatDateTime } from './date';

/**
 * CSV export, intended for a clinician to read alongside a glucose log.
 *
 * Includes the computed separation from the previous injection, because
 * that is the number the whole device exists to influence and it is not
 * something the reader can reconstruct from region and zone alone.
 */

const HEADER = [
  'Timestamp (ISO 8601)',
  'Local time',
  'Region',
  'Zone',
  'Separation from previous (mm)',
] as const;

/** RFC 4180 quoting: wrap in quotes and double any embedded quote. */
function cell(value: string | number): string {
  const s = String(value);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function buildCsv(logs: readonly LogEntry[], zoneCount: ZoneCount): string {
  const sorted = sortByTime(logs);
  const rows: string[] = [HEADER.map(cell).join(',')];

  let prev: LogEntry | null = null;
  for (const log of sorted) {
    const separation = prev === null ? '' : formatSeparation(separationMm(prev, log, zoneCount));
    rows.push(
      [
        cell(log.timestamp),
        cell(formatDateTime(log.timestamp)),
        cell(regionLabel(log.region)),
        cell(log.zone + 1),
        cell(separation),
      ].join(','),
    );
    prev = log;
  }

  // Trailing newline keeps POSIX tools and Excel equally happy.
  return `${rows.join('\r\n')}\r\n`;
}

function formatSeparation(mm: number): string {
  // Different body regions are not a measurable within-plate distance;
  // saying so is more honest than printing a made-up number.
  if (!Number.isFinite(mm)) return 'different region';
  return mm.toFixed(1);
}

export function csvFilename(now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 10);
  return `rotaguide-export-${stamp}.csv`;
}
