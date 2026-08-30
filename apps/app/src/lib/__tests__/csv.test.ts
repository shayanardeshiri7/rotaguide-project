import { describe, expect, it } from 'vitest';
import { buildCsv, csvFilename } from '../csv';
import type { LogEntry } from '@/domain/types';

const logs: LogEntry[] = [
  { id: 'a', region: 'abdomen-L', zone: 0, timestamp: '2026-04-01T08:00:00.000Z' },
  { id: 'b', region: 'abdomen-L', zone: 11, timestamp: '2026-04-01T20:00:00.000Z' },
  { id: 'c', region: 'thigh-R', zone: 3, timestamp: '2026-04-02T08:00:00.000Z' },
];

describe('buildCsv', () => {
  it('emits a header and one row per injection', () => {
    const rows = buildCsv(logs, 12).trimEnd().split('\r\n');
    expect(rows).toHaveLength(4);
    expect(rows[0]).toContain('Timestamp (ISO 8601)');
  });

  it('reports the computed separation from the previous injection', () => {
    // Zone 1 to zone 12 on a 4x3 plate: opposite corners.
    const rows = buildCsv(logs, 12).trimEnd().split('\r\n');
    expect(rows[1]).toContain(',');
    expect(rows[2]?.endsWith('108.2')).toBe(true);
  });

  it('leaves the first row without a separation', () => {
    const first = buildCsv(logs, 12).trimEnd().split('\r\n')[1] ?? '';
    expect(first.endsWith(',')).toBe(true);
  });

  it('says so plainly when the previous injection was in another region', () => {
    const rows = buildCsv(logs, 12).trimEnd().split('\r\n');
    expect(rows[3]).toContain('different region');
  });

  it('orders rows chronologically regardless of input order', () => {
    const shuffled = [logs[2]!, logs[0]!, logs[1]!];
    expect(buildCsv(shuffled, 12)).toBe(buildCsv(logs, 12));
  });

  it('displays zones one-indexed, matching the printed plate', () => {
    // Zone 0 internally is port "1" on the plate the user is holding.
    const row = buildCsv([logs[0]!], 12).trimEnd().split('\r\n')[1] ?? '';
    expect(row).toContain(',Abdomen L,1,');
  });

  it('quotes the local-time field, which contains a comma in en-CA', () => {
    // Unquoted, this would silently shift every later column by one.
    const row = buildCsv([logs[0]!], 12).trimEnd().split('\r\n')[1] ?? '';
    expect(row).toMatch(/"[^"]*,[^"]*"/);
  });

  it('ends with a trailing CRLF', () => {
    expect(buildCsv(logs, 12).endsWith('\r\n')).toBe(true);
  });

  it('produces a header-only file for an empty history', () => {
    expect(buildCsv([], 12).trimEnd().split('\r\n')).toHaveLength(1);
  });
});

describe('csvFilename', () => {
  it('stamps the current date', () => {
    expect(csvFilename(new Date('2026-04-10T12:00:00Z'))).toBe('rotaguide-export-2026-04-10.csv');
  });
});
