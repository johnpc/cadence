import { IonAlert } from '@ionic/react';
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearCache } from './clearCache';
import { useToast } from '../toast/useToast';
import { useConfirmedAction } from '../../lib/useConfirmedAction';

/** Clears Cadence's data caches (react-query + Cache Storage) so a stale or
 * wrong-looking screen can be forced to refetch. Guarded by a confirm since it
 * briefly re-loads everything. Does NOT sign out or touch likes/playlists. */
export function ClearCacheButton() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const clear = useConfirmedAction(
    useCallback(async () => {
      await clearCache(queryClient);
      toast('Cache cleared');
    }, [queryClient, toast]),
  );
  const busy = clear.phase === 'running';

  return (
    <>
      <button
        type="button"
        className="settings__clear-cache"
        data-testid="settings-clear-cache"
        disabled={busy}
        onClick={clear.ask}
      >
        {busy ? 'Clearing…' : 'Clear cache'}
      </button>
      <IonAlert
        isOpen={clear.phase === 'confirming'}
        header="Clear cache?"
        message="Reloads all data from your media server. Your account, likes, and playlists are not affected."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Clear', handler: () => void clear.run() },
        ]}
        onDidDismiss={clear.dismissed}
      />
    </>
  );
}
