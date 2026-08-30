import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { LogEntry, RegionId, ZoneCount } from '@/domain/types';
import { idbStorage } from '@/lib/storage';
import { newId } from '@/lib/id';
import { DEFAULT_STATE, parsePersistedState, type SyncSettings, type Theme } from '@/lib/schema';
import { migrateFromV1 } from '@/lib/migrate';

/**
 * Application state.
 *
 * The store holds data and intent only — every derived value (the
 * recommendation, adherence, risk levels) is computed by the pure domain
 * layer at render time. That keeps a single source of truth and means
 * changing an algorithm never requires a data migration.
 */

export interface AppState {
  // ── persisted ──
  zoneCount: ZoneCount;
  threshold: number;
  selectedRegion: RegionId;
  tutorialDone: boolean;
  theme: Theme;
  logs: LogEntry[];
  sync: SyncSettings;

  // ── ephemeral (never persisted) ──
  selectedZone: number | null;
  hydrated: boolean;
  migrationNotice: string | null;

  // ── actions ──
  selectRegion: (region: RegionId) => void;
  selectZone: (zone: number | null) => void;
  logInjection: (region: RegionId, zone: number, at?: Date) => LogEntry;
  deleteLog: (id: string) => void;
  clearAllData: () => void;
  setZoneCount: (count: ZoneCount) => void;
  setThreshold: (threshold: number) => void;
  setTheme: (theme: Theme) => void;
  completeTutorial: () => void;
  restartTutorial: () => void;
  setSync: (sync: Partial<SyncSettings>) => void;
  mergeRemoteLogs: (remote: readonly LogEntry[]) => void;
  dismissMigrationNotice: () => void;
  __setHydrated: (value: boolean) => void;
}

export const STORAGE_KEY = 'rotaguide-v2-state';

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      selectedZone: null,
      hydrated: false,
      migrationNotice: null,

      selectRegion: (region) => set({ selectedRegion: region, selectedZone: null }),

      selectZone: (zone) => set({ selectedZone: zone }),

      logInjection: (region, zone, at = new Date()) => {
        const entry: LogEntry = {
          id: newId(),
          region,
          zone,
          timestamp: at.toISOString(),
        };
        set((s) => ({ logs: [...s.logs, entry], selectedZone: null }));
        return entry;
      },

      deleteLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),

      clearAllData: () => set({ logs: [], selectedZone: null }),

      setZoneCount: (zoneCount) =>
        set((s) => ({
          zoneCount,
          // A zone index that no longer exists on a smaller guide would
          // point at nothing; drop the selection rather than clamp it to
          // a different body location.
          selectedZone: s.selectedZone !== null && s.selectedZone >= zoneCount ? null : s.selectedZone,
        })),

      setThreshold: (threshold) => set({ threshold }),

      setTheme: (theme) => set({ theme }),

      completeTutorial: () => set({ tutorialDone: true }),

      restartTutorial: () => set({ tutorialDone: false }),

      setSync: (partial) => set((s) => ({ sync: { ...s.sync, ...partial } })),

      mergeRemoteLogs: (remote) => {
        // Entries are immutable once written, so last-write-wins per id
        // is safe: identical ids carry identical content.
        const byId = new Map(get().logs.map((l) => [l.id, l]));
        for (const entry of remote) byId.set(entry.id, entry);
        set({ logs: [...byId.values()] });
      },

      dismissMigrationNotice: () => set({ migrationNotice: null }),

      __setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => idbStorage),
      version: 2,

      // Ephemeral fields are deliberately excluded: a stale selected zone
      // restored across sessions would be a confusing default.
      partialize: (s) => ({
        version: 2 as const,
        zoneCount: s.zoneCount,
        threshold: s.threshold,
        selectedRegion: s.selectedRegion,
        tutorialDone: s.tutorialDone,
        theme: s.theme,
        logs: s.logs,
        sync: s.sync,
      }),

      merge: (persisted, current) => {
        const { state } = parsePersistedState(persisted);
        return { ...current, ...state };
      },

      onRehydrateStorage: () => (state, error) => {
        if (error !== undefined && error !== null) {
          console.error('RotaGuide: could not read saved data', error);
        }
        if (!state) return;

        // Import v1 data once, after IndexedDB has been read, so we never
        // overwrite newer v2 entries with an old localStorage snapshot.
        try {
          const result = migrateFromV1(window.localStorage);
          if (result.migrated && result.state !== null) {
            const store = useStore.getState();
            store.mergeRemoteLogs(result.state.logs);

            const parts = [`Imported ${result.importedEntries} injections from your old app.`];
            if (result.droppedEntries > 0) {
              parts.push(`${result.droppedEntries} damaged entries could not be read.`);
            }
            useStore.setState({ migrationNotice: parts.join(' ') });
          }
        } catch (err) {
          console.error('RotaGuide: v1 import failed', err);
        }

        state.__setHydrated(true);
      },
    },
  ),
);
