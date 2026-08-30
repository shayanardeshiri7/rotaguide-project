import { useState } from 'react';
import { ZONE_COUNTS } from '@/domain/types';
import { zoneCountSchema, type Theme } from '@/lib/schema';
import { useStore } from '@/store/useStore';
import { buildCsv, csvFilename } from '@/lib/csv';
import { Modal } from '@/components/Modal';
import { SpotlightCard } from '@/components/SpotlightCard';
import { SyncSettings } from './SyncSettings';

export function SettingsTab({ onToast }: { onToast: (message: string) => void }) {
  const zoneCount = useStore((s) => s.zoneCount);
  const threshold = useStore((s) => s.threshold);
  const theme = useStore((s) => s.theme);
  const logs = useStore((s) => s.logs);
  const setZoneCount = useStore((s) => s.setZoneCount);
  const setThreshold = useStore((s) => s.setThreshold);
  const setTheme = useStore((s) => s.setTheme);
  const clearAllData = useStore((s) => s.clearAllData);
  const restartTutorial = useStore((s) => s.restartTutorial);

  const [clearing, setClearing] = useState(false);

  function exportCsv() {
    if (logs.length === 0) {
      onToast('Nothing to export yet');
      return;
    }
    const blob = new Blob([buildCsv(logs, zoneCount)], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = csvFilename();
    link.click();
    URL.revokeObjectURL(url);
    onToast('CSV exported');
  }

  return (
    <div className="panel" id="panel-settings" role="tabpanel" aria-labelledby="tab-settings">
      <SpotlightCard title="Guide">
        <div className="setting">
          <label htmlFor="zoneCount">
            <span className="setting__label">Zones per region</span>
            <span className="setting__hint">Match the guide you printed. V1 has 12 ports.</span>
          </label>
          <select
            id="zoneCount"
            value={zoneCount}
            onChange={(e) => setZoneCount(zoneCountSchema.parse(Number(e.target.value)))}
          >
            {ZONE_COUNTS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="setting">
          <label htmlFor="threshold">
            <span className="setting__label">Repeat warning after</span>
            <span className="setting__hint">
              Warn if a zone reappears within this many injections.
            </span>
          </label>
          <select
            id="threshold"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          >
            {[3, 5, 8, 12].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </SpotlightCard>

      <SpotlightCard title="Appearance">
        <div className="setting">
          <label htmlFor="theme">
            <span className="setting__label">Theme</span>
            <span className="setting__hint">System follows your device setting.</span>
          </label>
          <select
            id="theme"
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>
      </SpotlightCard>

      <SpotlightCard title="Your data">
        <p className="muted" style={{ marginTop: 0 }}>
          Your injection history is stored on this device. Nothing is sent anywhere unless you
          turn on sync below.
        </p>
        <div style={{ display: 'grid', gap: 'var(--rg-space-3)' }}>
          <button type="button" className="btn" onClick={exportCsv}>
            Export CSV ({logs.length} {logs.length === 1 ? 'entry' : 'entries'})
          </button>
          <button type="button" className="btn" onClick={restartTutorial}>
            Show the tutorial again
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => setClearing(true)}
            disabled={logs.length === 0}
          >
            Delete all data on this device
          </button>
        </div>
      </SpotlightCard>

      <SyncSettings onToast={onToast} />

      <p className="disclaimer">
        RotaGuide is a student engineering prototype from a university capstone project. It is
        not a medical device, has not been evaluated by Health Canada, and does not provide
        medical advice. Talk to your diabetes care team about injection technique.
      </p>

      <Modal
        open={clearing}
        title="Delete all data?"
        confirmLabel="Delete everything"
        tone="danger"
        onConfirm={() => {
          clearAllData();
          setClearing(false);
          onToast('All data deleted');
        }}
        onCancel={() => setClearing(false)}
      >
        This permanently removes all {logs.length} injections stored on this device. Export a CSV
        first if you want a copy. This cannot be undone.
      </Modal>
    </div>
  );
}
