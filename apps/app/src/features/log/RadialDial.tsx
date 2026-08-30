import { useRef } from 'react';
import { zoneColor } from '@rotaguide/ui';
import type { ZoneCount } from '@/domain/types';

/**
 * The zone dial.
 *
 * A radial dial is a *UI metaphor*, not a picture of the device — the
 * physical guide is a rectangular plate. The dial earns its place here
 * because it puts twelve targets within one thumb's reach on a phone,
 * which a 4x3 grid does not. Zone numbering matches the numerals
 * embossed on the printed plate, so "zone 7" means the same thing in
 * both hands.
 */

const CX = 140;
const CY = 140;
const R = 120;
const INNER_R = 45;

interface RadialDialProps {
  zoneCount: ZoneCount;
  selectedZone: number | null;
  recommendedZone: number;
  usageCounts: readonly number[];
  recentZones: readonly number[];
  regionLabel: string;
  onSelect: (zone: number) => void;
}

function polar(angle: number, radius: number) {
  return { x: CX + radius * Math.cos(angle), y: CY + radius * Math.sin(angle) };
}

export function RadialDial({
  zoneCount,
  selectedZone,
  recommendedZone,
  usageCounts,
  recentZones,
  regionLabel,
  onSelect,
}: RadialDialProps) {
  const groupRef = useRef<SVGGElement>(null);
  const step = (2 * Math.PI) / zoneCount;
  const labelSize = Math.max(9, 14 - Math.floor((zoneCount - 6) / 2));
  const countSize = Math.max(7, 10 - Math.floor((zoneCount - 6) / 2));

  /** Arrow keys cycle zones; Enter/Space is handled by the button role. */
  function handleKeyDown(event: React.KeyboardEvent<SVGGElement>) {
    const { key } = event;
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(key)) {
      return;
    }
    event.preventDefault();

    // Move relative to whatever currently has focus, falling back to the
    // selection. Focus is the keyboard user's cursor: arrowing away from
    // a focused zone must step to its neighbour, not select the zone
    // they are already sitting on.
    const focused = (event.target as Element | null)?.getAttribute?.('data-zone');
    const anchor = focused !== null && focused !== undefined ? Number(focused) : selectedZone;

    let next: number;
    if (key === 'Home') next = 0;
    else if (key === 'End') next = zoneCount - 1;
    else if (key === 'ArrowRight' || key === 'ArrowDown') {
      next = anchor === null ? 0 : (anchor + 1) % zoneCount;
    } else {
      next = anchor === null ? zoneCount - 1 : (anchor - 1 + zoneCount) % zoneCount;
    }

    onSelect(next);
    groupRef.current?.querySelector<SVGPathElement>(`[data-zone="${next}"]`)?.focus();
  }

  const recAngle = recommendedZone * step + step / 2 - Math.PI / 2;
  const recTip = polar(recAngle, R + 7);
  const recLeft = polar(recAngle - 0.06, R + 18);
  const recRight = polar(recAngle + 0.06, R + 18);

  return (
    <div className="dial-wrap">
      <svg
        className="dial"
        viewBox="0 0 280 280"
        role="group"
        aria-label={`Injection zones for ${regionLabel}. Use arrow keys to move between zones.`}
      >
        <defs>
          <radialGradient
            id="dialShine"
            cx="50%"
            cy="15%"
            r="85%"
            gradientUnits="userSpaceOnUse"
            gradientTransform={`translate(${CX},${CY}) scale(${R}) translate(-1,-1)`}
          >
            <stop offset="0%" stopColor="white" stopOpacity="0.28" />
            <stop offset="60%" stopColor="white" stopOpacity="0.06" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>

          <filter id="selBright" x="-20%" y="-20%" width="140%" height="140%">
            <feColorMatrix
              type="matrix"
              values="1.3 0 0 0 0.06  0 1.3 0 0 0.06  0 0 1.3 0 0.06  0 0 0 1 0"
            />
            <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="white" floodOpacity="0.45" />
          </filter>

          {/* Diagonal hatch marks zones used recently — a second channel
              beyond colour, so the state survives colour-blindness. */}
          <pattern
            id="hatch"
            patternUnits="userSpaceOnUse"
            width="5"
            height="5"
            patternTransform="rotate(45)"
          >
            <line x1="0" y1="0" x2="0" y2="5" stroke="rgba(0,0,0,0.18)" strokeWidth="1.2" />
          </pattern>
        </defs>

        <g ref={groupRef} onKeyDown={handleKeyDown}>
          {Array.from({ length: zoneCount }, (_, zone) => {
            const start = zone * step - Math.PI / 2;
            const end = (zone + 1) * step - Math.PI / 2;
            const mid = start + step / 2;

            const o1 = polar(start, R);
            const o2 = polar(end, R);
            const i1 = polar(start, INNER_R);
            const i2 = polar(end, INNER_R);
            const largeArc = step > Math.PI ? 1 : 0;

            const path = [
              `M ${i1.x} ${i1.y}`,
              `L ${o1.x} ${o1.y}`,
              `A ${R} ${R} 0 ${largeArc} 1 ${o2.x} ${o2.y}`,
              `L ${i2.x} ${i2.y}`,
              `A ${INNER_R} ${INNER_R} 0 ${largeArc} 0 ${i1.x} ${i1.y}`,
              'Z',
            ].join(' ');

            const isSelected = selectedZone === zone;
            const isRecent = recentZones.includes(zone);
            const isRecommended = recommendedZone === zone;
            const count = usageCounts[zone] ?? 0;
            const labelPos = polar(mid, (R + INNER_R) / 2);

            const state = isSelected
              ? 'selected'
              : isRecommended
                ? 'recommended next'
                : isRecent
                  ? 'used recently'
                  : 'available';

            return (
              <g key={zone}>
                <path
                  d={path}
                  data-zone={zone}
                  className="dial__sector"
                  role="button"
                  tabIndex={isSelected || (selectedZone === null && zone === 0) ? 0 : -1}
                  aria-pressed={isSelected}
                  aria-label={`Zone ${zone + 1}, ${state}, used ${count} ${
                    count === 1 ? 'time' : 'times'
                  }`}
                  fill={zoneColor(zone)}
                  fillOpacity={isRecent && !isSelected ? 0.6 : 1}
                  stroke="var(--rg-bg)"
                  strokeWidth={2}
                  filter={isSelected ? 'url(#selBright)' : undefined}
                  onClick={() => onSelect(zone)}
                />
                {isRecent && !isSelected && (
                  <path d={path} fill="url(#hatch)" pointerEvents="none" />
                )}
                <path d={path} fill="url(#dialShine)" pointerEvents="none" />
                <text
                  className="dial__label"
                  x={labelPos.x}
                  y={labelPos.y + (count > 0 ? -2 : 4)}
                  fontSize={labelSize}
                  textAnchor="middle"
                >
                  {zone + 1}
                </text>
                {count > 0 && (
                  <text
                    className="dial__count"
                    x={labelPos.x}
                    y={labelPos.y + 11}
                    fontSize={countSize}
                    textAnchor="middle"
                  >
                    {count}x
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Pulsing arrow just outside the ring, pointing at the suggestion */}
        <polygon
          className="dial__rec-arrow"
          points={`${recTip.x},${recTip.y} ${recLeft.x},${recLeft.y} ${recRight.x},${recRight.y}`}
        />

        {/* Glass hub */}
        <circle cx={CX} cy={CY} r={INNER_R - 1} fill="var(--rg-surface)" />
        <circle
          cx={CX}
          cy={CY}
          r={INNER_R - 1}
          fill="none"
          stroke="var(--rg-accent)"
          strokeWidth="1.5"
          opacity="0.4"
        />
        <text className="dial__hub-label" x={CX} y={CY - 8}>
          NEXT
        </text>
        <text className="dial__hub-value" x={CX} y={CY + 16}>
          {recommendedZone + 1}
        </text>
      </svg>
    </div>
  );
}
