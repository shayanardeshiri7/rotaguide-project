import { describe, expect, it } from 'vitest';
import { formatDateTime, formatDay, formatRelative, formatTime } from '../date';

/**
 * These strings appear next to every log entry and are read by people
 * who may be older or tired. They are held to plain language, and they
 * must never render "NaN" or "Invalid Date" at a user.
 */

const NOW = Date.parse('2026-04-10T12:00:00.000Z');
const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

function isoAgo(ms: number): string {
  return new Date(NOW - ms).toISOString();
}

describe('formatRelative', () => {
  it('describes the recent past in plain language', () => {
    expect(formatRelative(isoAgo(0), NOW)).toBe('just now');
    expect(formatRelative(isoAgo(30_000), NOW)).toBe('just now');
    expect(formatRelative(isoAgo(5 * MINUTE), NOW)).toBe('5 min ago');
    expect(formatRelative(isoAgo(3 * HOUR), NOW)).toBe('3 h ago');
    expect(formatRelative(isoAgo(DAY), NOW)).toBe('yesterday');
    expect(formatRelative(isoAgo(5 * DAY), NOW)).toBe('5 days ago');
  });

  it('switches to months and years for older entries', () => {
    expect(formatRelative(isoAgo(45 * DAY), NOW)).toBe('1 month ago');
    expect(formatRelative(isoAgo(120 * DAY), NOW)).toBe('4 months ago');
    expect(formatRelative(isoAgo(400 * DAY), NOW)).toBe('1 year ago');
    expect(formatRelative(isoAgo(800 * DAY), NOW)).toBe('2 years ago');
  });

  it('singularises correctly', () => {
    expect(formatRelative(isoAgo(35 * DAY), NOW)).toBe('1 month ago');
    expect(formatRelative(isoAgo(70 * DAY), NOW)).toBe('2 months ago');
  });

  it('renders a dash rather than NaN for an unreadable timestamp', () => {
    expect(formatRelative('not a date', NOW)).toBe('—');
  });
});

describe('formatDateTime / formatTime / formatDay', () => {
  const iso = '2026-04-10T15:30:00.000Z';

  it('uses a 24-hour clock, per the en-CA style rule', () => {
    // A 12-hour clock without am/pm would be ambiguous in a log a
    // clinician might read.
    expect(formatTime(iso)).toMatch(/^\d{2}:\d{2}$/);
  });

  it('formats an unambiguous date and time', () => {
    expect(formatDateTime(iso)).toMatch(/^\d{4}-\d{2}-\d{2}, \d{2}:\d{2}$/);
  });

  it('formats a short human day', () => {
    expect(formatDay(iso)).toMatch(/^[A-Z][a-z]{2}, [A-Z][a-z]{2} \d{1,2}$/);
  });

  it('degrades to a dash on bad input rather than showing Invalid Date', () => {
    expect(formatDateTime('nope')).toBe('—');
    expect(formatTime('nope')).toBe('—');
    expect(formatDay('nope')).toBe('—');
  });
});
