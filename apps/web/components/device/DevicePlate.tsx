'use client';

import { useState } from 'react';

/**
 * The guide, drawn from the report's dimensions rather than photographed.
 *
 * Vector means it stays sharp at any size and the V1→V2 change can be
 * animated between two real geometries instead of cross-fading two
 * images. Every number here is the as-built measurement.
 */

const PITCH = 30; // mm, centre to centre
const PORT_D = 10; // mm
// Material beyond the outermost port centres, per edge. Wider on the
// left and right because the numerals are embossed beside the holes.
// These reproduce the as-built ~12 x 8 cm V1 footprint.
const MARGIN_X = 15;
const MARGIN_Y = 10;

interface Variant {
  readonly id: 'v1' | 'v2';
  readonly cols: number;
  readonly rows: number;
  readonly label: string;
  readonly footprint: string;
  readonly notch: boolean;
  readonly summary: string;
}

const VARIANTS: readonly Variant[] = [
  {
    id: 'v1',
    cols: 4,
    rows: 3,
    label: 'V1',
    footprint: '~12 × 8 cm',
    notch: false,
    summary: '12 ports in one placement. Sits flat on the abdomen and thigh.',
  },
  {
    id: 'v2',
    cols: 2,
    rows: 3,
    label: 'V2',
    footprint: '~6 × 8 cm',
    notch: true,
    summary:
      'Half the width, so it sits flat on a curved upper arm. The notch on the left edge can be found by touch, so the plate can be aligned without looking at it.',
  },
];

export function DevicePlate() {
  const [active, setActive] = useState<'v1' | 'v2'>('v1');
  const variant = VARIANTS.find((v) => v.id === active) ?? VARIANTS[0]!;

  const plateW = (variant.cols - 1) * PITCH + MARGIN_X * 2;
  const plateH = (variant.rows - 1) * PITCH + MARGIN_Y * 2;

  // Fixed viewBox across both variants so the plate visibly shrinks
  // rather than being rescaled to fill the frame.
  const VB_W = 160;
  const VB_H = 120;
  const originX = (VB_W - plateW) / 2;
  const originY = (VB_H - plateH) / 2;

  return (
    <div>
      <div
        role="group"
        aria-label="Guide version"
        style={{ display: 'flex', gap: 'var(--rg-space-2)', marginBottom: 'var(--rg-space-6)' }}
      >
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            className="button"
            aria-pressed={active === v.id}
            onClick={() => setActive(v.id)}
            style={
              active === v.id
                ? { borderColor: 'var(--rg-accent)', color: 'var(--rg-accent-dark)' }
                : undefined
            }
          >
            {v.label}
          </button>
        ))}
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label={`${variant.label} guide: ${variant.cols * variant.rows} ports in ${
          variant.cols
        } columns and ${variant.rows} rows, ${PITCH} millimetre spacing, ${
          variant.footprint
        } footprint.${variant.notch ? ' Includes a tactile notch on the left edge.' : ''}`}
        style={{ width: '100%', height: 'auto' }}
      >
        <defs>
          <linearGradient id="plateFace" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--rg-surface)" />
            <stop offset="100%" stopColor="var(--rg-surface-alt)" />
          </linearGradient>
        </defs>

        {/* Plate body. The transition is on the geometry, so V1→V2 reads
            as the same object changing rather than a slide swap. */}
        <rect
          x={originX}
          y={originY}
          width={plateW}
          height={plateH}
          rx={4}
          fill="url(#plateFace)"
          stroke="var(--rg-accent)"
          strokeWidth={0.8}
          style={{ transition: 'all 0.6s var(--rg-ease)' }}
        />

        {/* Tactile reference notch — V2 only */}
        {variant.notch && (
          <path
            d={`M ${originX} ${originY + plateH / 2 - 5}
                L ${originX + 5} ${originY + plateH / 2}
                L ${originX} ${originY + plateH / 2 + 5} Z`}
            fill="var(--rg-bg)"
            stroke="var(--rg-accent)"
            strokeWidth={0.8}
          />
        )}

        {/* Ports */}
        {Array.from({ length: variant.cols * variant.rows }, (_, i) => {
          const col = i % variant.cols;
          const row = Math.floor(i / variant.cols);
          const cx = originX + MARGIN_X + col * PITCH;
          const cy = originY + MARGIN_Y + row * PITCH;
          return (
            <g key={i} style={{ transition: 'all 0.6s var(--rg-ease)' }}>
              <circle
                cx={cx}
                cy={cy}
                r={PORT_D / 2}
                fill="var(--rg-bg)"
                stroke="var(--rg-accent)"
                strokeWidth={0.6}
              />
              <text
                x={cx + PORT_D / 2 + 1.5}
                y={cy + 2}
                fontSize={4.5}
                fill="var(--rg-text-muted)"
                fontFamily="var(--rg-font-mono)"
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* Spacing callout between the first two ports */}
        {variant.cols > 1 && (
          <g stroke="var(--rg-caution)" strokeWidth={0.5} fill="var(--rg-caution)">
            <line
              x1={originX + MARGIN_X}
              y1={originY + plateH + 6}
              x2={originX + MARGIN_X + PITCH}
              y2={originY + plateH + 6}
            />
            <line
              x1={originX + MARGIN_X}
              y1={originY + plateH + 4}
              x2={originX + MARGIN_X}
              y2={originY + plateH + 8}
            />
            <line
              x1={originX + MARGIN_X + PITCH}
              y1={originY + plateH + 4}
              x2={originX + MARGIN_X + PITCH}
              y2={originY + plateH + 8}
            />
            <text
              x={originX + MARGIN_X + PITCH / 2}
              y={originY + plateH + 13}
              fontSize={5}
              textAnchor="middle"
              stroke="none"
              fontFamily="var(--rg-font-mono)"
            >
              30 mm
            </text>
          </g>
        )}
      </svg>

      <p
        style={{
          fontSize: 'var(--rg-text-sm)',
          color: 'var(--rg-text-muted)',
          marginTop: 'var(--rg-space-4)',
        }}
        aria-live="polite"
      >
        <strong style={{ color: 'var(--rg-text)' }}>
          {variant.label} · {variant.footprint}
        </strong>{' '}
        — {variant.summary}
      </p>
    </div>
  );
}
