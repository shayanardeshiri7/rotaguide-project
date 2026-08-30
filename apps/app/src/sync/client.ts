import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase client, loaded lazily and only if the app was built with
 * credentials.
 *
 * The import is dynamic on purpose. Sync is opt-in and off by default,
 * so a local-first user must not pay ~300 KB of transfer for a feature
 * they never turn on — that would undercut the offline-first claim the
 * whole app is built around. The module is fetched the first time
 * someone actually enables backup.
 *
 * When no keys are configured the feature disappears from the UI
 * entirely: a deployment without Supabase is a supported configuration,
 * not a misconfiguration.
 */

const url = import.meta.env['VITE_SUPABASE_URL'];
const anonKey = import.meta.env['VITE_SUPABASE_ANON_KEY'];

let clientPromise: Promise<SupabaseClient> | null = null;

export function isSyncConfigured(): boolean {
  return (
    typeof url === 'string' && url.length > 0 && typeof anonKey === 'string' && anonKey.length > 0
  );
}

export async function getClient(): Promise<SupabaseClient | null> {
  if (!isSyncConfigured()) return null;

  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(url as string, anonKey as string, {
      auth: {
        // Magic link only — no passwords to store, no OAuth provider
        // collecting a profile we have no use for.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }),
  );

  return clientPromise;
}
