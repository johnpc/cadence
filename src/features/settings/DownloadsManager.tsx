import { IonAlert } from '@ionic/react';
import { useCallback } from 'react';
import { useDownloads } from '../downloads/useDownloads';
import { removeAllDownloads } from '../downloads/downloadStore';
import { useToast } from '../toast/useToast';
import { useConfirmedAction } from '../../lib/useConfirmedAction';

/** Settings "Downloads" section: shows how many tracks are saved for offline and
 * lets the user free the space with one tap (confirmed). Hidden when nothing is
 * downloaded — no empty control to explain. */
export function DownloadsManager() {
  const { tracks } = useDownloads();
  const toast = useToast();
  const removeAll = useConfirmedAction(
    useCallback(async () => {
      await removeAllDownloads();
      toast('Downloads removed');
    }, [toast]),
  );
  if (tracks.length === 0) return null;

  const count = tracks.length;
  const busy = removeAll.phase === 'running';

  return (
    <section className="settings__downloads">
      <h2 className="settings__title cad-kicker">Downloads</h2>
      <p className="cad-meta" data-testid="downloads-count">
        {count} {count === 1 ? 'track' : 'tracks'} saved for offline listening.
      </p>
      <button
        type="button"
        className="settings__clear-cache"
        data-testid="remove-all-downloads"
        disabled={busy}
        onClick={removeAll.ask}
      >
        {busy ? 'Removing…' : 'Remove all downloads'}
      </button>
      <IonAlert
        isOpen={removeAll.phase === 'confirming'}
        header="Remove all downloads?"
        message="Deletes every track saved for offline playback. You can re-download them anytime."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Remove', handler: () => void removeAll.run() },
        ]}
        onDidDismiss={removeAll.dismissed}
      />
    </section>
  );
}
