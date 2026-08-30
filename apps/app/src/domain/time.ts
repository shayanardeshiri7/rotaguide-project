/**
 * Time helpers. Every function takes `now` explicitly so the domain
 * layer never reads the clock — that keeps it pure and the tests
 * deterministic.
 */

export const MS_PER_DAY = 86_400_000;

/** Epoch ms for an ISO timestamp, or null if it cannot be parsed. */
export function parseInstant(iso: string): number | null {
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

/**
 * Fractional days between `then` and `now`. Clamped at zero: a timestamp
 * in the future is treated as "just now" rather than producing a negative
 * age that would invert every recency weight downstream.
 */
export function daysBetween(thenMs: number, nowMs: number): number {
  return Math.max(0, (nowMs - thenMs) / MS_PER_DAY);
}

/** Whole days elapsed, floored. */
export function wholeDaysBetween(thenMs: number, nowMs: number): number {
  return Math.floor(daysBetween(thenMs, nowMs));
}

/**
 * Exponential recency weight in (0, 1]. A site used just now weighs 1;
 * one used a half-life ago weighs 0.5. This is what makes the
 * recommendation forget old history gracefully instead of treating a
 * six-month-old injection as equally relevant to yesterday's.
 */
export function recencyWeight(ageDays: number, halfLifeDays: number): number {
  return Math.pow(0.5, ageDays / halfLifeDays);
}

/** Local calendar day key (YYYY-MM-DD) for streak counting. */
export function dayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
