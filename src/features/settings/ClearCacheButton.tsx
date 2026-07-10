import { IonAlert } from '@ionic/react';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearCache } from './clearCache';
import { useToast } from '../toast/useToast';

/** Clears Cadence's data caches (react-query + Cache Storage) so a stale or
 * wrong-looking screen can be forced to refetch. Guarded by a confirm since it
 * briefly re-loads everything. Does NOT sign out or touch likes/playlists. */
export function ClearCacheButton() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  const run = async () => {
    setBusy(true);
    try {
      await clearCache(queryClient);
      toast('Cache cleared');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="settings__clear-cache"
        data-testid="settings-clear-cache"
        disabled={busy}
        onClick={() => setConfirmOpen(true)}
      >
        {busy ? 'Clearing…' : 'Clear cache'}
      </button>
      <IonAlert
        isOpen={confirmOpen}
        header="Clear cache?"
        message="Reloads all data from your Jellyfin server. Your account, likes, and playlists are not affected."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Clear', handler: () => void run() },
        ]}
        onDidDismiss={() => setConfirmOpen(false)}
      />
    </>
  );
}
