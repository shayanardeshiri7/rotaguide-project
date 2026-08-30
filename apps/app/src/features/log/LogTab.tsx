import { useState } from 'react';
import { REGIONS, regionLabel } from '@/domain/types';
import { sortByTime } from '@/domain/adherence';
import { logsForRegion } from '@/domain/zones';
import { useStore } from '@/store/useStore';
import { useRecommendation, useRepeatRisk, useZoneUsage } from '@/store/selectors';
import { RadialDial } from './RadialDial';
import { Modal } from '@/components/Modal';
import { SpotlightCard } from '@/components/SpotlightCard';

export function LogTab({ onLogged }: { onLogged: (message: string) => void }) {
  const region = useStore((s) => s.selectedRegion);
  const selectedZone = useStore((s) => s.selectedZone);
  const zoneCount = useStore((s) => s.zoneCount);
  const threshold = useStore((s) => s.threshold);
  const logs = useStore((s) => s.logs);
  const selectRegion = useStore((s) => s.selectRegion);
  const selectZone = useStore((s) => s.selectZone);
  const logInjection = useStore((s) => s.logInjection);

  const recommendation = useRecommendation();
  const usage = useZoneUsage();
  const risk = useRepeatRisk(selectedZone);
  const [confirming, setConfirming] = useState(false);

  const recentZones = sortByTime(logsForRegion(logs, region, zoneCount))
    .slice(-threshold)
    .map((l) => l.zone);

  function commit() {
    if (selectedZone === null) return;
    logInjection(region, selectedZone);
    setConfirming(false);
    onLogged(`Logged ${regionLabel(region)}, zone ${selectedZone + 1}`);
  }

  function attemptLog() {
    if (selectedZone === null) return;
    // Only interrupt for a real repeat. A confirmation dialog on every
    // log would train people to dismiss it without reading.
    if (risk !== null && risk.level !== 'none') setConfirming(true);
    else commit();
  }

  return (
    <div className="panel" id="panel-log" role="tabpanel" aria-labelledby="tab-log">
      <div className="regions" role="group" aria-label="Body region">
        {REGIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className="region-btn"
            aria-pressed={r.id === region}
            onClick={() => selectRegion(r.id)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="rec">
        <span className="rec__zone">{recommendation.zone + 1}</span>
        <span>
          <strong>Suggested next</strong>
          <br />
          {describeRecommendation(recommendation.reason, recommendation.restDays)}
        </span>
      </div>

      <RadialDial
        zoneCount={zoneCount}
        selectedZone={selectedZone}
        recommendedZone={recommendation.zone}
        usageCounts={usage}
        recentZones={recentZones}
        regionLabel={regionLabel(region)}
        onSelect={selectZone}
      />

      {risk !== null && risk.level !== 'none' && (
        <div className={`risk risk--${risk.level}`} role="status">
          {risk.reason}
        </div>
      )}

      <button
        type="button"
        className="btn btn--primary"
        disabled={selectedZone === null}
        onClick={attemptLog}
      >
        {selectedZone === null
          ? 'Select a zone to log'
          : `Log ${regionLabel(region)}, zone ${selectedZone + 1}`}
      </button>

      <SpotlightCard title="How to use" className="how-to">
        <p className="muted" style={{ margin: 0 }}>
          Place the guide, inject through the port matching the highlighted zone, then tap that
          zone here. The suggestion moves you as far from your recent sites as the guide allows.
        </p>
      </SpotlightCard>

      <Modal
        open={confirming}
        title={risk?.level === 'warning' ? 'Zone used repeatedly' : 'Zone used recently'}
        confirmLabel="Log anyway"
        cancelLabel="Pick another"
        tone={risk?.level === 'warning' ? 'danger' : 'default'}
        onConfirm={commit}
        onCancel={() => setConfirming(false)}
      >
        {risk?.reason ?? ''}
      </Modal>
    </div>
  );
}

function describeRecommendation(
  reason: 'first-injection' | 'unused-zone' | 'furthest-from-recent',
  restDays: number | null,
): string {
  switch (reason) {
    case 'first-injection':
      return 'No injections recorded here yet — start anywhere.';
    case 'unused-zone':
      return 'You have not used this zone in this region yet.';
    case 'furthest-from-recent':
      return restDays === null
        ? 'Furthest from where you have injected lately.'
        : `Furthest from your recent sites; last used ${restDays} ${
            restDays === 1 ? 'day' : 'days'
          } ago.`;
  }
}
