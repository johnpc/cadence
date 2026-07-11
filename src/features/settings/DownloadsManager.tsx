import { IonAlert } from '@ionic/react';
import { useState } from 'react';
import { useDownloads } from '../downloads/useDownloads';
import { removeAllDownloads } from '../downloads/downloadStore';
import { useToast } from '../toast/useToast';

/** Settings "Downloads" section: shows how many tracks are saved for offline and
 * lets the user free the space with one tap (confirmed). Hidden when nothing is
 * downloaded — no empty control to explain. */
export function DownloadsManager() {
  const { tracks } = useDownloads();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  if (tracks.length === 0) return null;

  const count = tracks.length;
  const run = async () => {
    setBusy(true);
    try {
      await removeAllDownloads();
      toast('Downloads removed');
    } finally {
      setBusy(false);
    }
  };

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
        onClick={() => setConfirmOpen(true)}
      >
        {busy ? 'Removing…' : 'Remove all downloads'}
      </button>
      <IonAlert
        isOpen={confirmOpen}
        header="Remove all downloads?"
        message="Deletes every track saved for offline playback. You can re-download them anytime."
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          { text: 'Remove', handler: () => void run() },
        ]}
        onDidDismiss={() => setConfirmOpen(false)}
      />
    </section>
  );
}
