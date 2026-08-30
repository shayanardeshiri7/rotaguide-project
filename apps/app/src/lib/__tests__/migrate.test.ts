import { beforeEach, describe, expect, it } from 'vitest';
import {
  MIGRATION_FLAG,
  V1_LEGACY_KEY,
  V1_STORAGE_KEY,
  migrateFromV1,
} from '../migrate';

/**
 * Migration is the highest-stakes code in the app: silently losing a
 * user's injection history would be worse than any UI bug. These cases
 * cover the shapes v1 actually wrote, plus the corrupt ones it could
 * leave behind.
 */

class MemoryStorage implements Storage {
  private map = new Map<string, string>();
  private readonly failWrites: boolean;

  constructor(failWrites = false) {
    this.failWrites = failWrites;
  }

  get length() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
  getItem(key: string) {
    return this.map.get(key) ?? null;
  }
  key(index: number) {
    return [...this.map.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.map.delete(key);
  }
  setItem(key: string, value: string) {
    if (this.failWrites) throw new DOMException('QuotaExceededError');
    this.map.set(key, value);
  }
}

/** The exact shape v1 persisted under `rotaguide_v2`. */
function v1Payload(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    zoneCount: 12,
    threshold: 5,
    tutorialDone: true,
    darkMode: false,
    logs: [
      { id: 'a1', region: 'abdomen-L', zone: 0, timestamp: '2026-04-01T08:00:00.000Z' },
      { id: 'a2', region: 'thigh-R', zone: 7, timestamp: '2026-04-02T08:00:00.000Z' },
    ],
    ...overrides,
  });
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
});

describe('migrateFromV1', () => {
  it('imports a full v1 payload', () => {
    storage.setItem(V1_STORAGE_KEY, v1Payload());
    const result = migrateFromV1(storage);

    expect(result.migrated).toBe(true);
    expect(result.source).toBe('v1');
    expect(result.importedEntries).toBe(2);
    expect(result.droppedEntries).toBe(0);
    expect(result.state?.logs.map((l) => l.id)).toEqual(['a1', 'a2']);
    expect(result.state?.zoneCount).toBe(12);
    expect(result.state?.tutorialDone).toBe(true);
  });

  it('never deletes the v1 data it read', () => {
    storage.setItem(V1_STORAGE_KEY, v1Payload());
    migrateFromV1(storage);
    // The old key survives so a failed migration can be retried by hand.
    expect(storage.getItem(V1_STORAGE_KEY)).not.toBeNull();
  });

  it('runs only once', () => {
    storage.setItem(V1_STORAGE_KEY, v1Payload());
    expect(migrateFromV1(storage).migrated).toBe(true);

    const second = migrateFromV1(storage);
    expect(second.migrated).toBe(false);
    expect(second.source).toBe('already-migrated');
  });

  it('translates the v1 darkMode boolean into the v2 theme setting', () => {
    storage.setItem(V1_STORAGE_KEY, v1Payload({ darkMode: true }));
    expect(migrateFromV1(storage).state?.theme).toBe('dark');
  });

  it('drops individual corrupt entries but keeps the rest of the history', () => {
    // The critical case: one bad row must not cost the user everything.
    storage.setItem(
      V1_STORAGE_KEY,
      JSON.stringify({
        logs: [
          { id: 'good', region: 'abdomen-L', zone: 3, timestamp: '2026-04-01T08:00:00.000Z' },
          { id: 'no-region', zone: 3, timestamp: '2026-04-01T08:00:00.000Z' },
          { id: 'bad-region', region: 'elbow-L', zone: 3, timestamp: '2026-04-01T08:00:00.000Z' },
          { id: 'bad-zone', region: 'abdomen-L', zone: 99, timestamp: '2026-04-01T08:00:00.000Z' },
          { id: 'bad-time', region: 'abdomen-L', zone: 3, timestamp: 'yesterday-ish' },
          'not even an object',
          null,
          { id: 'good2', region: 'arm-R', zone: 1, timestamp: '2026-04-03T08:00:00.000Z' },
        ],
      }),
    );

    const result = migrateFromV1(storage);
    expect(result.state?.logs.map((l) => l.id)).toEqual(['good', 'good2']);
    expect(result.droppedEntries).toBe(6);
  });

  it('de-duplicates entries sharing an id', () => {
    storage.setItem(
      V1_STORAGE_KEY,
      JSON.stringify({
        logs: [
          { id: 'dup', region: 'abdomen-L', zone: 1, timestamp: '2026-04-01T08:00:00.000Z' },
          { id: 'dup', region: 'abdomen-L', zone: 1, timestamp: '2026-04-01T08:00:00.000Z' },
        ],
      }),
    );
    expect(migrateFromV1(storage).state?.logs).toHaveLength(1);
  });

  it('falls back to the even older rotaguide_data key', () => {
    storage.setItem(
      V1_LEGACY_KEY,
      JSON.stringify({
        logs: [
          { id: 'old', region: 'thigh-L', zone: 2, timestamp: '2026-03-01T08:00:00.000Z' },
        ],
      }),
    );
    const result = migrateFromV1(storage);
    expect(result.source).toBe('legacy');
    expect(result.importedEntries).toBe(1);
  });

  it('prefers the newer key when both exist', () => {
    storage.setItem(V1_STORAGE_KEY, v1Payload());
    storage.setItem(
      V1_LEGACY_KEY,
      JSON.stringify({ logs: [{ id: 'old', region: 'arm-L', zone: 0, timestamp: 'x' }] }),
    );
    expect(migrateFromV1(storage).source).toBe('v1');
  });

  it('treats unparseable JSON as no data rather than throwing', () => {
    storage.setItem(V1_STORAGE_KEY, '{{{ not json');
    const result = migrateFromV1(storage);
    expect(result.migrated).toBe(false);
    expect(result.source).toBe('none');
  });

  it('marks a fresh install as migrated so the check stops re-running', () => {
    const result = migrateFromV1(storage);
    expect(result.migrated).toBe(false);
    expect(storage.getItem(MIGRATION_FLAG)).not.toBeNull();
  });

  it('can inspect without committing', () => {
    storage.setItem(V1_STORAGE_KEY, v1Payload());
    const result = migrateFromV1(storage, { commit: false });
    expect(result.migrated).toBe(true);
    expect(storage.getItem(MIGRATION_FLAG)).toBeNull();
  });

  it('still imports when the flag cannot be written', () => {
    // Private browsing: writes throw, but the user's data must still
    // come through for this session.
    const readable = new MemoryStorage();
    readable.setItem(V1_STORAGE_KEY, v1Payload());

    const failing = new MemoryStorage(true);
    failing.getItem = (key) => readable.getItem(key);

    const result = migrateFromV1(failing);
    expect(result.migrated).toBe(true);
    expect(result.importedEntries).toBe(2);
  });
});
