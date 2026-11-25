import { useState } from 'react';
import { IonActionSheet, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useSeedRadio } from '../player/useSeedRadio';
import { albumMenuButtons } from './albumMenuButtons';
import { useToast } from '../toast/useToast';
import { shareItem, shareOrigin } from '../share/shareLink';
import { usePlayer } from '../player/usePlayer';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The album "…" overflow: add to queue, start an album radio (instant-mix),
 * jump to the artist, or share — the secondary actions the header no longer
 * shows as their own icons. */
export function AlbumMenu({ album, tracks }: { album: JellyfinItem; tracks: JellyfinItem[] }) {
  const [open, setOpen] = useState(false);
  const history = useHistory();
  const seedRadio = useSeedRadio();
  const toast = useToast();
  const { addToQueue } = usePlayer();
  const buttons = albumMenuButtons(album, {
    addToQueue: () => {
      addToQueue(tracks);
      toast(`Added ${tracks.length} ${tracks.length === 1 ? 'song' : 'songs'} to queue`);
    },
    startRadio: () => {
      void seedRadio(album.Id);
      toast('Starting radio');
    },
    goToArtist: () => history.push(`/artist/${album.ArtistItems?.[0]?.Id}`),
    share: () =>
      void shareItem(album, shareOrigin()).then((r) => {
        // 'failed' is usually a dismissed share sheet — stay silent there.
        if (r === 'shared') toast('Shared');
        else if (r === 'copied') toast('Link copied');
      }),
  });
  return (
    <>
      <button
        type="button"
        className="album__more"
        onClick={() => setOpen(true)}
        data-testid="album-more"
        aria-label="More options"
      >
        <IonIcon icon={ellipsisHorizontal} />
      </button>
      <IonActionSheet
        isOpen={open}
        header="Album options"
        buttons={buttons}
        onDidDismiss={() => setOpen(false)}
      />
    </>
  );
}
