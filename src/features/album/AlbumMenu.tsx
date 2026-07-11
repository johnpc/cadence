import { useState } from 'react';
import { IonActionSheet, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { useSeedRadio } from '../player/useSeedRadio';
import { albumMenuButtons } from './albumMenuButtons';
import { useToast } from '../toast/useToast';
import { copyShareLink } from '../share/shareLink';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The album "…" overflow: start an album radio (instant-mix), jump to the
 * artist, or copy a share link — matching the song/artist overflow menus. */
export function AlbumMenu({ album }: { album: JellyfinItem }) {
  const [open, setOpen] = useState(false);
  const history = useHistory();
  const seedRadio = useSeedRadio();
  const toast = useToast();
  const buttons = albumMenuButtons(album, {
    startRadio: () => {
      void seedRadio(album.Id);
      toast('Starting radio');
    },
    goToArtist: () => history.push(`/artist/${album.ArtistItems?.[0]?.Id}`),
    copyLink: () =>
      void copyShareLink(album, window.location.origin).then((ok) =>
        toast(ok ? 'Link copied' : 'Could not copy link'),
      ),
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
