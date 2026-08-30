import { useState } from 'react';
import { zoneColor } from '@rotaguide/ui';
import { regionLabel } from '@/domain/types';
import { useInsights, useZoneUsage } from '@/store/selectors';
import { useStore } from '@/store/useStore';
import { SpotlightCard } from '@/components/SpotlightCard';

/**
 * Charts are hand-rolled SVG/CSS. A charting library would add ~100 KB
 * for four simple visualisations, and this app has to work offline on a
 * phone — the bundle cost is not worth it.
 */
export function InsightsTab() {
  const [windowDays, setWindowDays] = useState(7);
  const zoneCount = useStore((s) => s.zoneCount);
  const region = useStore((s) => s.selectedRegion);
  const usage = useZoneUsage();
  const { daily, byRegion, alerts } = useInsights(windowDays);

  const maxUse = Math.max(1, ...usage);
  const maxDaily = Math.max(1, ...daily.map((d) => d.count));
  const cols = zoneCount === 12 ? 4 : zoneCount === 10 ? 5 : zoneCount === 8 ? 4 : 3;

  return (
    <div className="panel" id="panel-insights" role="tabpanel" aria-labelledby="tab-insights">
      <SpotlightCard title={`Zone use — ${regionLabel(region)}`}>
        <div
          className="heatmap"
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
          role="img"
          aria-label={usage
            .map((count, zone) => `zone ${zone + 1}: ${count} injections`)
            .join(', ')}
        >
          {usage.map((count, zone) => (
            <div
              key={zone}
              className="heatmap__cell"
              style={{
                background:
                  count === 0
                    ? 'var(--rg-surface-alt)'
                    : `color-mix(in srgb, ${zoneColor(zone)} ${
                        25 + (count / maxUse) * 75
                      }%, transparent)`,
                color: count / maxUse > 0.55 ? '#fff' : 'var(--rg-text)',
              }}
            >
              {count}
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>
          Darker means used more often. An even spread is the goal.
        </p>
      </SpotlightCard>

      <SpotlightCard title="Injections per day">
        <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 96 }}>
          {daily.map((d) => (
            <div
              key={d.day}
              title={`${d.day}: ${d.count}`}
              style={{
                flex: 1,
                height: `${Math.max(3, (d.count / maxDaily) * 100)}%`,
                background: d.count === 0 ? 'var(--rg-surface-alt)' : 'var(--rg-accent)',
                borderRadius: 4,
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {[7, 30].map((n) => (
            <button
              key={n}
              type="button"
              className="btn"
              aria-pressed={windowDays === n}
              style={
                windowDays === n
                  ? { borderColor: 'var(--rg-accent)', color: 'var(--rg-accent-dark)' }
                  : undefined
              }
              onClick={() => setWindowDays(n)}
            >
              {n} days
            </button>
          ))}
        </div>
      </SpotlightCard>

      <SpotlightCard title="Rotation by region">
        {byRegion.every((r) => r.score === null) ? (
          <p className="empty">Log at least two injections in a region to see its rotation.</p>
        ) : (
          byRegion.map((row) => {
            const pct = row.score === null ? null : Math.round(row.score * 100);
            return (
              <div key={row.region} className="bar-row">
                <span className="bar-row__label">{regionLabel(row.region)}</span>
                <span className="bar-row__track">
                  <span
                    className="bar-row__fill"
                    style={{
                      width: `${pct ?? 0}%`,
                      background:
                        pct === null
                          ? 'transparent'
                          : pct >= 80
                            ? 'var(--rg-accent)'
                            : pct >= 50
                              ? 'var(--rg-caution)'
                              : 'var(--rg-warn)',
                    }}
                  />
                </span>
                <span className="bar-row__value">{pct === null ? '—' : `${pct}%`}</span>
              </div>
            );
          })
        )}
      </SpotlightCard>

      <SpotlightCard title="Repeat-site notices">
        {alerts.length === 0 ? (
          <p className="muted" style={{ margin: 0, color: 'var(--rg-accent)' }}>
            No repeat-site patterns in your recent injections.
          </p>
        ) : (
          alerts.map((alert) => (
            <div key={`${alert.region}-${alert.zone}`} className="risk risk--caution">
              <strong>
                {regionLabel(alert.region)} zone {alert.zone + 1}
              </strong>{' '}
              — used {alert.count} times in your last {alert.windowSize} injections. Spacing
              sites out is associated with lower lipohypertrophy risk.
            </div>
          ))
        )}
      </SpotlightCard>
    </div>
  );
}
