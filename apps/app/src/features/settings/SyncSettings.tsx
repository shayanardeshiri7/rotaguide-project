import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useSync } from '@/sync/useSync';
import { Modal } from '@/components/Modal';
import { SpotlightCard } from '@/components/SpotlightCard';
import { formatRelative } from '@/lib/date';

/**
 * Opt-in cloud sync.
 *
 * The consent step is not a checkbox with a link to a policy — it states
 * in plain language exactly which fields leave the device and which
 * never do. The project's ethics analysis names false reassurance and
 * silent data transmission as its two top risks; this screen is the
 * mitigation for the second.
 */
export function SyncSettings({ onToast }: { onToast: (message: string) => void }) {
  const sync = useStore((s) => s.sync);
  const setSync = useStore((s) => s.setSync);
  const { configured, session, status, error, signIn, signOut, runSync, deleteRemoteData } =
    useSync();

  const [consenting, setConsenting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [email, setEmail] = useState('');

  // A build without Supabase credentials hides the feature entirely
  // rather than showing a toggle that cannot work.
  if (!configured) return null;

  return (
    <SpotlightCard title="Cloud backup (optional)">
      <div className="setting">
        <label htmlFor="syncToggle">
          <span className="setting__label">Back up to the cloud</span>
          <span className="setting__hint">Off by default. The app works fully without this.</span>
        </label>
        <input
          id="syncToggle"
          type="checkbox"
          checked={sync.enabled}
          style={{ width: 24, height: 24 }}
          onChange={(e) => {
            if (e.target.checked) setConsenting(true);
            else {
              setSync({ enabled: false });
              onToast('Cloud backup turned off');
            }
          }}
        />
      </div>

      {sync.enabled && (
        <>
          {session === null ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const result = await signIn(email);
                onToast(result.message);
              }}
              style={{ display: 'grid', gap: 'var(--rg-space-3)', marginTop: 'var(--rg-space-3)' }}
            >
              <label htmlFor="syncEmail" className="setting__label">
                Email for your sign-in link
              </label>
              <input
                id="syncEmail"
                type="email"
                required
                value={email}
                placeholder="you@example.com"
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  font: 'inherit',
                  minHeight: 'var(--rg-tap-min)',
                  padding: '0 var(--rg-space-3)',
                  borderRadius: 'var(--rg-radius-sm)',
                  border: '1.5px solid var(--rg-border)',
                  background: 'var(--rg-surface)',
                  color: 'var(--rg-text)',
                }}
              />
              <button type="submit" className="btn">
                Email me a sign-in link
              </button>
              <p className="setting__hint" style={{ margin: 0 }}>
                We use a one-time link, so there is no password to store.
              </p>
            </form>
          ) : (
            <div
              style={{ display: 'grid', gap: 'var(--rg-space-3)', marginTop: 'var(--rg-space-3)' }}
            >
              <p className="muted" style={{ margin: 0 }}>
                Signed in as {session.user.email}.{' '}
                {sync.lastSyncedAt === null
                  ? 'Not synced yet.'
                  : `Last synced ${formatRelative(sync.lastSyncedAt)}.`}
              </p>
              <button
                type="button"
                className="btn"
                disabled={status === 'syncing'}
                onClick={() => void runSync()}
              >
                {status === 'syncing' ? 'Syncing…' : 'Sync now'}
              </button>
              <button type="button" className="btn" onClick={() => void signOut()}>
                Sign out
              </button>
              <button type="button" className="btn btn--danger" onClick={() => setDeleting(true)}>
                Delete my cloud copy
              </button>
              {error !== null && (
                <p className="risk risk--warning" style={{ margin: 0 }}>
                  {error}
                </p>
              )}
            </div>
          )}
        </>
      )}

      <Modal
        open={consenting}
        title="Before you turn this on"
        confirmLabel="I understand, turn it on"
        cancelLabel="Keep it off"
        onConfirm={() => {
          setSync({ enabled: true, consentedAt: new Date().toISOString() });
          setConsenting(false);
          onToast('Cloud backup enabled — sign in to start');
        }}
        onCancel={() => setConsenting(false)}
      >
        Turning this on copies your injection records to a server so you can restore them on another
        device. What gets sent: the body region, the zone number, and the date and time of each
        injection. What never gets sent: your name, date of birth, glucose readings, insulin doses,
        or anything you have not logged in this app. You can turn it off or delete the cloud copy at
        any time, and your on-device history stays either way.
      </Modal>

      <Modal
        open={deleting}
        title="Delete your cloud copy?"
        confirmLabel="Delete cloud copy"
        tone="danger"
        onConfirm={async () => {
          const result = await deleteRemoteData();
          setDeleting(false);
          onToast(result.message);
        }}
        onCancel={() => setDeleting(false)}
      >
        This removes every injection record stored on the server and signs you out. The history on
        this device is not affected. This cannot be undone.
      </Modal>
    </SpotlightCard>
  );
}
