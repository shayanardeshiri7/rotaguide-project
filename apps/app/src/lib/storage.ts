import { del, get, set } from 'idb-keyval';
import type { StateStorage } from 'zustand/middleware';

/**
 * Persistence for the Zustand store.
 *
 * IndexedDB is the main store: localStorage caps out around 5 MB and
 * blocks the main thread on every write, which a user injecting four
 * times a day for years would eventually feel on a low-end phone.
 *
 * But IndexedDB writes are asynchronous, and that opens a real hole. If
 * the tab is closed, reloaded, or crashes in the moment between logging
 * an injection and the transaction committing, the entry is gone. That
 * is precisely the failure this app must not have — it was reproducible
 * in an end-to-end test that logged an injection and reloaded
 * immediately, and the entry was lost every time.
 *
 * So every write also goes to localStorage synchronously, before the
 * IndexedDB write is even started. The mirror is therefore never staler
 * than IndexedDB, and a reload one millisecond after logging still finds
 * the entry. A sequence number on each record lets the reader pick the
 * newer of the two without guessing, which matters when the mirror write
 * fails on quota and silently stops advancing.
 */

const MIRROR_PREFIX = 'rotaguide.mirror.';
const SEQ_KEY = 'rotaguide.mirror.seq';

interface Record_ {
  readonly seq: number;
  readonly value: string;
}

const memoryFallback = new Map<string, Record_>();
let idbUnavailable = false;

function nextSeq(): number {
  try {
    const current = Number(window.localStorage.getItem(SEQ_KEY) ?? '0');
    const next = Number.isFinite(current) ? current + 1 : 1;
    window.localStorage.setItem(SEQ_KEY, String(next));
    return next;
  } catch {
    return Date.now();
  }
}

function readMirror(name: string): Record_ | null {
  try {
    const raw = window.localStorage.getItem(MIRROR_PREFIX + name);
    if (raw === null) return null;
    const parsed = JSON.parse(raw) as Record_;
    return typeof parsed?.value === 'string' && typeof parsed.seq === 'number' ? parsed : null;
  } catch {
    return null;
  }
}

function writeMirror(name: string, record: Record_): void {
  try {
    window.localStorage.setItem(MIRROR_PREFIX + name, JSON.stringify(record));
  } catch {
    // Quota exceeded or storage disabled. IndexedDB remains the store of
    // record; we simply lose the crash-window protection for this write.
  }
}

export const idbStorage: StateStorage = {
  async getItem(name) {
    const mirror = readMirror(name);

    let stored: Record_ | null = null;
    if (idbUnavailable) {
      stored = memoryFallback.get(name) ?? null;
    } else {
      try {
        stored = (await get<Record_>(name)) ?? null;
      } catch {
        idbUnavailable = true;
        stored = memoryFallback.get(name) ?? null;
      }
    }

    // Whichever write happened last wins. Normally they match; they
    // diverge only when a write was interrupted mid-flight.
    if (stored === null) return mirror?.value ?? null;
    if (mirror === null) return stored.value;
    return mirror.seq > stored.seq ? mirror.value : stored.value;
  },

  async setItem(name, value) {
    const record: Record_ = { seq: nextSeq(), value };

    // Synchronous first: this is the write that survives an immediate
    // reload.
    writeMirror(name, record);

    if (idbUnavailable) {
      memoryFallback.set(name, record);
      return;
    }
    try {
      await set(name, record);
    } catch {
      idbUnavailable = true;
      memoryFallback.set(name, record);
    }
  },

  async removeItem(name) {
    memoryFallback.delete(name);
    try {
      window.localStorage.removeItem(MIRROR_PREFIX + name);
    } catch {
      // nothing to do
    }
    if (idbUnavailable) return;
    try {
      await del(name);
    } catch {
      idbUnavailable = true;
    }
  },
};

/** True when IndexedDB failed and this session is running on the mirror. */
export function isEphemeral(): boolean {
  return idbUnavailable;
}

/** Test seam — resets the fallback latch between cases. */
export function __resetStorageFallback(): void {
  idbUnavailable = false;
  memoryFallback.clear();
}
