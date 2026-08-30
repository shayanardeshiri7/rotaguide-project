import { zoneColor } from '@rotaguide/ui';
import { regionLabel } from '@/domain/types';
import { useHistoryStats, useRecentLogs } from '@/store/selectors';
import { useStore } from '@/store/useStore';
import { CountUp } from '@/components/CountUp';
import { SpotlightCard } from '@/components/SpotlightCard';
import { formatDay, formatRelative, formatTime } from '@/lib/date';

export function HistoryTab({ onDeleted }: { onDeleted: (message: string) => void }) {
  const stats = useHistoryStats();
  const recent = useRecentLogs(30);
  const deleteLog = useStore((s) => s.deleteLog);

  return (
    <div className="panel" id="panel-history" role="tabpanel" aria-labelledby="tab-history">
      <div className="stats">
        <div className="stat">
          <span className="stat__value">
            <CountUp value={stats.total} />
          </span>
          <span className="stat__label">Injections</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            <CountUp value={stats.streak} />
          </span>
          <span className="stat__label">Day streak</span>
        </div>
        <div className="stat">
          <span className="stat__value">
            {stats.adherence === null ? '—' : <CountUp value={stats.adherence} suffix="%" />}
          </span>
          <span className="stat__label">Rotation</span>
        </div>
      </div>

      <p className="muted" style={{ marginTop: 0 }}>
        Rotation is the share of consecutive injections at least 20 mm apart — the spacing the
        guide was designed around.
      </p>

      <SpotlightCard title="Recent injections">
        {recent.length === 0 ? (
          <p className="empty">
            Nothing logged yet. Your history will appear here once you log an injection.
          </p>
        ) : (
          <ul className="log-list">
            {recent.map((log) => (
              <li key={log.id} className="log-item">
                <span
                  className="log-item__swatch"
                  style={{ background: zoneColor(log.zone) }}
                  aria-hidden="true"
                >
                  {log.zone + 1}
                </span>
                <span className="log-item__body">
                  <span className="log-item__region">
                    {regionLabel(log.region)} · Zone {log.zone + 1}
                  </span>
                  <br />
                  <span className="log-item__meta">
                    {formatDay(log.timestamp)}, {formatTime(log.timestamp)} ·{' '}
                    {formatRelative(log.timestamp)}
                  </span>
                </span>
                <button
                  type="button"
                  className="log-item__delete"
                  aria-label={`Delete injection at ${regionLabel(log.region)} zone ${
                    log.zone + 1
                  } on ${formatDay(log.timestamp)}`}
                  onClick={() => {
                    deleteLog(log.id);
                    onDeleted('Entry deleted');
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </SpotlightCard>
    </div>
  );
}
