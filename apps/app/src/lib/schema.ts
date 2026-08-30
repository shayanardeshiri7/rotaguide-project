import { z } from 'zod';
import { REGION_IDS } from '@/domain/types';

/**
 * Zod schemas guarding the storage boundary.
 *
 * Persisted state is the only untrusted input this app has: it can be
 * hand-edited, corrupted, or written by an older version. Everything
 * that comes back off disk is parsed here before it reaches the store.
 */

export const logEntrySchema = z.object({
  id: z.string().min(1),
  region: z.enum(REGION_IDS),
  zone: z.number().int().min(0).max(11),
  timestamp: z.string().refine((s) => !Number.isNaN(Date.parse(s)), {
    message: 'timestamp must be a parseable ISO 8601 instant',
  }),
});

export const zoneCountSchema = z.union([z.literal(6), z.literal(8), z.literal(10), z.literal(12)]);

export const themeSchema = z.enum(['light', 'dark', 'system']);

export const syncSettingsSchema = z.object({
  /** Off by default, always. Sync is opt-in behind an explicit consent step. */
  enabled: z.boolean().default(false),
  consentedAt: z.string().nullable().default(null),
  lastSyncedAt: z.string().nullable().default(null),
});

export const persistedStateSchema = z.object({
  version: z.literal(2),
  zoneCount: zoneCountSchema.default(12),
  threshold: z.number().int().min(1).max(20).default(5),
  selectedRegion: z.enum(REGION_IDS).default('abdomen-L'),
  tutorialDone: z.boolean().default(false),
  theme: themeSchema.default('system'),
  logs: z.array(logEntrySchema).default([]),
  sync: syncSettingsSchema.default({
    enabled: false,
    consentedAt: null,
    lastSyncedAt: null,
  }),
});

export type PersistedState = z.infer<typeof persistedStateSchema>;
export type SyncSettings = z.infer<typeof syncSettingsSchema>;
export type Theme = z.infer<typeof themeSchema>;

export const DEFAULT_STATE: PersistedState = {
  version: 2,
  zoneCount: 12,
  threshold: 5,
  selectedRegion: 'abdomen-L',
  tutorialDone: false,
  theme: 'system',
  logs: [],
  sync: { enabled: false, consentedAt: null, lastSyncedAt: null },
};

/**
 * Parse persisted state, salvaging as much as possible.
 *
 * A single corrupt log entry must not cost the user their whole history,
 * so entries are validated individually and bad ones dropped, rather
 * than failing the whole document. Returns the defaults only when
 * nothing usable can be recovered.
 */
export function parsePersistedState(raw: unknown): {
  state: PersistedState;
  droppedEntries: number;
} {
  if (raw === null || typeof raw !== 'object') {
    return { state: DEFAULT_STATE, droppedEntries: 0 };
  }

  const candidate = raw as Record<string, unknown>;
  const rawLogs = Array.isArray(candidate['logs']) ? candidate['logs'] : [];

  const logs = [];
  let droppedEntries = 0;
  for (const entry of rawLogs) {
    const parsed = logEntrySchema.safeParse(entry);
    if (parsed.success) logs.push(parsed.data);
    else droppedEntries++;
  }

  // De-duplicate by id — a resumed sync could deliver the same entry twice.
  const byId = new Map(logs.map((l) => [l.id, l]));

  const result = persistedStateSchema.safeParse({
    ...candidate,
    version: 2,
    logs: [...byId.values()],
  });

  if (!result.success) return { state: DEFAULT_STATE, droppedEntries };
  return { state: result.data, droppedEntries };
}
