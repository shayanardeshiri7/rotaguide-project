/**
 * Typed mirror of tokens.css for the values JS actually needs —
 * SVG fills, canvas effects, chart colours. Everything else should
 * reference the CSS custom property directly.
 */

export const ZONE_COLORS = [
  '#2D7A5F',
  '#3B8DB5',
  '#7B5EA7',
  '#C75B39',
  '#D4973B',
  '#5B8C3E',
  '#B55B7A',
  '#4A7A8C',
  '#6B8E6B',
  '#8B6B4E',
  '#5A6ABF',
  '#BF5A8A',
] as const;

export type ZoneColor = (typeof ZONE_COLORS)[number];

/** Zone indices are 0-based internally and displayed +1. */
export function zoneColor(zone: number): string {
  return ZONE_COLORS[zone % ZONE_COLORS.length] ?? ZONE_COLORS[0];
}

export const COLORS = {
  accent: '#2D7A5F',
  accentDark: '#1E5A43',
  accentLight: '#E8F5EE',
  warn: '#C75B39',
  caution: '#D4973B',
  bg: '#F7F5F2',
  text: '#1A1A1A',
} as const;

/** WCAG 2.2 AA minimum tap target, in px. */
export const TAP_MIN = 44;
