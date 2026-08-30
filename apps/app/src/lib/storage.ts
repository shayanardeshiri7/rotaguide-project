import { del, get, set } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/**
 * IndexedDB-backed storage for the Zustand persist middleware.
 *
 * localStorage caps out around 5 MB and blocks the main thread on every
 * write; IndexedDB does neither and survives storage pressure better.
 * A user injecting four times a day for five years is ~7,300 entries,
 * which localStorage would handle — but the synchronous writes on every
 * log would be felt on a low-end phone.
 *
 * Falls back to an in-memory map when IndexedDB is unavailable (private
 * browsing, embedded webviews) so the app still runs for the session
 * rather than crashing on launch.
 */

const memoryFallback = new Map<string, string>();
let useFallback = false;

export const idbStorage: StateStorage = {
  async getItem(name) {
    if (useFallback) return memoryFallback.get(name) ?? null;
    try {
      return (await get<string>(name)) ?? null;
    } catch {
      useFallback = true;
      return memoryFallback.get(name) ?? null;
    }
  },

  async setItem(name, value) {
    if (useFallback) {
      memoryFallback.set(name, value);
      return;
    }
    try {
      await set(name, value);
    } catch {
      useFallback = true;
      memoryFallback.set(name, value);
    }
  },

  async removeItem(name) {
    memoryFallback.delete(name);
    if (useFallback) return;
    try {
      await del(name);
    } catch {
      useFallback = true;
    }
  },
};

/** True when persistence has degraded to memory-only for this session. */
export function isEphemeral(): boolean {
  return useFallback;
}

/** Test seam — resets the fallback latch between cases. */
export function __resetStorageFallback(): void {
  useFallback = false;
  memoryFallback.clear();
}
