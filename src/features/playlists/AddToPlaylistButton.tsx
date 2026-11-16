import { IonActionSheet, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import { usePlaylists } from './playlistsApi';
import { addToPlaylistWithToast } from './addWithToast';
import { addToPlaylistButtons } from './trackMenuButtons';
import { getRecentPlaylistAdds, touchPlaylistAdd } from './recentPlaylistAdds';
import { useTrackMenuActions, type RowEdit } from './useTrackMenuActions';
import { NewPlaylistAlert } from './NewPlaylistAlert';
import { useToast } from '../toast/useToast';
import { useOverlay } from '../../lib/useOverlay';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './addToPlaylist.css';

/** The per-track "…" menu — the single trailing control on every track row. It
 * holds ALL row actions (like, download, play next, add to queue, add to
 * playlist, radio, go to album/artist, copy link, and — in an editable playlist
 * — reorder + remove), so the row itself stays art + title + "…". */
export function AddToPlaylistButton({ track, edit }: { track: JellyfinItem; edit?: RowEdit }) {
  const overlay = useOverlay<'menu' | 'pick' | 'new'>();
  const { playlists } = usePlaylists();
  const toast = useToast();
  const { buttons, add } = useTrackMenuActions(track, () => overlay.show('pick'), edit);

  const pickButtons = addToPlaylistButtons(
    playlists,
    {
      newPlaylist: () => overlay.show('new'),
      addTo: (pl) => {
        touchPlaylistAdd(pl.Id, Date.now()); // bubble this playlist up next time
        addToPlaylistWithToast(add, toast, pl.Id, track.Id, pl.Name ?? 'playlist');
      },
    },
    getRecentPlaylistAdds(),
  );

  return (
    <>
      <button
        type="button"
        className="add-pl-btn"
        onClick={(e) => {
          e.stopPropagation();
          overlay.show('menu');
        }}
        data-testid="add-to-playlist"
        aria-label="Track options"
      >
        <IonIcon icon={ellipsisHorizontal} />
      </button>
      <IonActionSheet
        isOpen={overlay.open === 'menu'}
        header="Track options"
        buttons={buttons}
        onDidDismiss={() => overlay.closed('menu')}
      />
      <IonActionSheet
        isOpen={overlay.open === 'pick'}
        header="Add to playlist"
        buttons={pickButtons}
        onDidDismiss={() => overlay.closed('pick')}
        data-testid="add-to-playlist-sheet"
      />
      <NewPlaylistAlert
        open={overlay.open === 'new'}
        onClose={() => overlay.closed('new')}
        itemId={track.Id}
      />
    </>
  );
}
