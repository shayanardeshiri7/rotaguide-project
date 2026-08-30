import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '@/store/useStore';
import { LogTab } from '@/features/log/LogTab';
import { HistoryTab } from '@/features/history/HistoryTab';
import { InsightsTab } from '@/features/insights/InsightsTab';
import { SettingsTab } from '@/features/settings/SettingsTab';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { Toast } from '@/components/Toast';

const TABS = [
  { id: 'log', label: 'Log', icon: '◎' },
  { id: 'history', label: 'History', icon: '☰' },
  { id: 'insights', label: 'Insights', icon: '▤' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function App() {
  const [tab, setTab] = useState<TabId>('log');
  const [toast, setToast] = useState<string | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const hydrated = useStore((s) => s.hydrated);
  const tutorialDone = useStore((s) => s.tutorialDone);
  const theme = useStore((s) => s.theme);
  const migrationNotice = useStore((s) => s.migrationNotice);
  const dismissMigrationNotice = useStore((s) => s.dismissMigrationNotice);

  // Theme: an explicit choice wins; "system" follows the OS and keeps
  // following it if the user changes it while the app is open.
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && media.matches);
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    };
    apply();
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => {
    if (migrationNotice !== null) {
      setToast(migrationNotice);
      dismissMigrationNotice();
    }
  }, [migrationNotice, dismissMigrationNotice]);

  const showToast = useCallback((message: string) => setToast(message), []);

  /** Roving arrow-key navigation across the tab bar, per WAI-ARIA. */
  function onTabKeyDown(event: React.KeyboardEvent, index: number) {
    if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();

    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? TABS.length - 1
          : event.key === 'ArrowRight'
            ? (index + 1) % TABS.length
            : (index - 1 + TABS.length) % TABS.length;

    const target = TABS[next];
    if (!target) return;
    setTab(target.id);
    tabRefs.current[target.id]?.focus();
  }

  // Wait for IndexedDB before first paint of real content — rendering an
  // empty history and then filling it in reads as data loss.
  if (!hydrated) {
    return (
      <div className="app">
        <p className="empty" role="status">
          Loading your data…
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="app">
        <header className="header">
          <div>
            <h1>
              Rota<span>Guide</span>
            </h1>
            <p className="header__sub">Injection site rotation tracker</p>
          </div>
        </header>

        <main>
          {tab === 'log' && <LogTab onLogged={showToast} />}
          {tab === 'history' && <HistoryTab onDeleted={showToast} />}
          {tab === 'insights' && <InsightsTab />}
          {tab === 'settings' && <SettingsTab onToast={showToast} />}
        </main>
      </div>

      <nav className="tabs" role="tablist" aria-label="Sections">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[t.id] = el;
            }}
            type="button"
            className="tab"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => setTab(t.id)}
            onKeyDown={(e) => onTabKeyDown(e, i)}
          >
            <span className="tab__icon" aria-hidden="true">
              {t.icon}
            </span>
            {t.label}
          </button>
        ))}
      </nav>

      <Toast message={toast} onDone={() => setToast(null)} />
      {!tutorialDone && <Onboarding />}
    </>
  );
}
