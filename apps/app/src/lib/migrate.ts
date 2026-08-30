import { DEFAULT_STATE, parsePersistedState, type PersistedState } from './schema';

/**
 * Migration from the v1 single-file app.
 *
 * v1 kept everything in localStorage under `rotaguide_v2` (the key was
 * versioned separately from the app). v2 stores state in IndexedDB.
 *
 * Silently losing a user's injection history is the worst bug this app
 * could ship, so this module is deliberately conservative:
 *   - the v1 key is never deleted, only marked as migrated
 *   - a corrupt entry is dropped, never the whole history
 *   - migration runs once and records that it did
 */

export const V1_STORAGE_KEY = 'rotaguide_v2';
export const V1_LEGACY_KEY = 'rotaguide_data';
export const MIGRATION_FLAG = 'rotaguide_migrated_to_v2';

export interface MigrationResult {
  readonly migrated: boolean;
  readonly state: PersistedState | null;
  readonly importedEntries: number;
  readonly droppedEntries: number;
  readonly source: 'none' | 'v1' | 'legacy' | 'already-migrated';
}

const NOTHING: MigrationResult = {
  migrated: false,
  state: null,
  importedEntries: 0,
  droppedEntries: 0,
  source: 'none',
};

function readKey(storage: Storage, key: string): unknown {
  try {
    const raw = storage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    // A malformed JSON blob is treated as absent rather than fatal.
    return null;
  }
}

/**
 * Read any v1 data present in `storage` and convert it to v2 shape.
 * Pure with respect to the returned value — the only write is the
 * migration flag, and only when `commit` is true.
 */
export function migrateFromV1(
  storage: Storage,
  options: { commit?: boolean } = {},
): MigrationResult {
  const commit = options.commit ?? true;

  try {
    if (storage.getItem(MIGRATION_FLAG) !== null) {
      return { ...NOTHING, source: 'already-migrated' };
    }
  } catch {
    // No accessible storage (private mode, disabled cookies) — nothing
    // to migrate, and nothing to report.
    return NOTHING;
  }

  const v1 = readKey(storage, V1_STORAGE_KEY);
  const legacy = v1 === null ? readKey(storage, V1_LEGACY_KEY) : null;
  const source: MigrationResult['source'] =
    v1 !== null ? 'v1' : legacy !== null ? 'legacy' : 'none';

  if (source === 'none') {
    // Mark it anyway: a fresh install has nothing to import, and this
    // stops the check re-running on every launch.
    if (commit) safeSet(storage, MIGRATION_FLAG, new Date().toISOString());
    return NOTHING;
  }

  const raw = (v1 ?? legacy) as Record<string, unknown>;
  const { state, droppedEntries } = parsePersistedState({
    ...DEFAULT_STATE,
    ...raw,
    version: 2,
    // v1 stored dark mode as a boolean; v2 has a three-way theme setting.
    theme: raw['darkMode'] === true ? 'dark' : DEFAULT_STATE.theme,
  });

  if (commit) safeSet(storage, MIGRATION_FLAG, new Date().toISOString());

  return {
    migrated: true,
    state,
    importedEntries: state.logs.length,
    droppedEntries,
    source,
  };
}

function safeSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // Quota or private-mode failure. The import already succeeded in
    // memory; worst case the check runs again next launch and finds the
    // same data, which de-duplicates by entry id.
  }
}
