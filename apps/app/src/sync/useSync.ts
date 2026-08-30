import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getClient, isSyncConfigured } from './client';
import { useStore } from '@/store/useStore';
import { logEntrySchema } from '@/lib/schema';
import type { LogEntry } from '@/domain/types';

/**
 * Optional cloud sync.
 *
 * The project's own style guide says: never transmit injection data
 * off-device without explicit user consent. That makes this feature
 * opt-in, off by default, and gated behind a consent step that states
 * plainly what leaves the device. Nothing here runs until the user has
 * both consented and signed in.
 *
 * Conflict resolution is last-write-wins per entry id, which is safe
 * because entries are immutable once written — the same id always
 * carries the same content.
 */

export type SyncStatus = 'idle' | 'syncing' | 'error';

interface RemoteRow {
  id: string;
  region: string;
  zone: number;
  occurred_at: string;
}

export function useSync() {
  const configured = isSyncConfigured();
  const sync = useStore((s) => s.sync);
  const logs = useStore((s) => s.logs);
  const setSync = useStore((s) => s.setSync);
  const mergeRemoteLogs = useStore((s) => s.mergeRemoteLogs);

  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  // Only reach for the Supabase module once the user has opted in —
  // see the note in client.ts about not paying for a disabled feature.
  useEffect(() => {
    if (!sync.enabled) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    void getClient().then((client) => {
      if (client === null || cancelled) return;
      void client.auth.getSession().then(({ data }) => setSession(data.session));
      const { data: sub } = client.auth.onAuthStateChange((_event, next) => setSession(next));
      unsubscribe = () => sub.subscription.unsubscribe();
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [sync.enabled]);

  const signIn = useCallback(async (email: string) => {
    const client = await getClient();
    if (client === null) return { ok: false, message: 'Sync is not configured.' };

    const { error: signInError } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    if (signInError) return { ok: false, message: signInError.message };
    return { ok: true, message: 'Check your email for a sign-in link.' };
  }, []);

  const signOut = useCallback(async () => {
    const client = await getClient();
    await client?.auth.signOut();
    setSession(null);
  }, []);

  /** Push local entries, pull remote ones, merge both ways. */
  const runSync = useCallback(async () => {
    const client = await getClient();
    if (client === null || session === null || !sync.enabled) return;

    setStatus('syncing');
    setError(null);

    try {
      // Push. Entries are immutable, so an id collision means the rows
      // are identical and the upsert is a no-op.
      if (logs.length > 0) {
        const rows = logs.map((l) => ({
          id: l.id,
          user_id: session.user.id,
          region: l.region,
          zone: l.zone,
          occurred_at: l.timestamp,
        }));
        const { error: upsertError } = await client
          .from('injections')
          .upsert(rows, { onConflict: 'id' });
        if (upsertError) throw upsertError;
      }

      // Pull.
      const { data, error: selectError } = await client
        .from('injections')
        .select('id, region, zone, occurred_at');
      if (selectError) throw selectError;

      const remote: LogEntry[] = [];
      for (const row of (data ?? []) as RemoteRow[]) {
        const parsed = logEntrySchema.safeParse({
          id: row.id,
          region: row.region,
          zone: row.zone,
          timestamp: row.occurred_at,
        });
        // Remote data is validated exactly like local data — the server
        // is not more trusted than the disk.
        if (parsed.success) remote.push(parsed.data);
      }
      mergeRemoteLogs(remote);

      setSync({ lastSyncedAt: new Date().toISOString() });
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Sync failed.');
    }
  }, [session, sync.enabled, logs, mergeRemoteLogs, setSync]);

  /** Irreversible: removes every remote row and signs the user out. */
  const deleteRemoteData = useCallback(async () => {
    const client = await getClient();
    if (client === null || session === null) return { ok: false, message: 'Not signed in.' };

    const { error: deleteError } = await client
      .from('injections')
      .delete()
      .eq('user_id', session.user.id);
    if (deleteError) return { ok: false, message: deleteError.message };

    await client.auth.signOut();
    setSession(null);
    setSync({ enabled: false, consentedAt: null, lastSyncedAt: null });
    return { ok: true, message: 'Cloud copy deleted. Your on-device history is untouched.' };
  }, [session, setSync]);

  return {
    configured,
    session,
    status,
    error,
    signIn,
    signOut,
    runSync,
    deleteRemoteData,
  };
}
