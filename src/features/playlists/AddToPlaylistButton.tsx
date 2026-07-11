import { useState } from 'react';
import { IonActionSheet, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import { usePlaylists } from './playlistsApi';
import { addToPlaylistWithToast } from './addWithToast';
import { addToPlaylistButtons } from './trackMenuButtons';
import { useTrackMenuActions, type RowEdit } from './useTrackMenuActions';
import { NewPlaylistAlert } from './NewPlaylistAlert';
import { useToast } from '../toast/useToast';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './addToPlaylist.css';

/** The per-track "…" menu — the single trailing control on every track row. It
 * holds ALL row actions (like, download, play next, add to queue, add to
 * playlist, radio, go to album/artist, copy link, and — in an editable playlist
 * — reorder + remove), so the row itself stays art + title + "…". */
export function AddToPlaylistButton({ track, edit }: { track: JellyfinItem; edit?: RowEdit }) {
  const [open, setOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const { playlists } = usePlaylists();
  const toast = useToast();
  const { buttons, add } = useTrackMenuActions(track, () => setPickOpen(true), edit);

  const pickButtons = addToPlaylistButtons(playlists, {
    newPlaylist: () => setNewOpen(true),
    addTo: (pl) => addToPlaylistWithToast(add, toast, pl.Id, track.Id, pl.Name ?? 'playlist'),
  });

  return (
    <>
      <button
        type="button"
        className="add-pl-btn"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        data-testid="add-to-playlist"
        aria-label="Track options"
      >
        <IonIcon icon={ellipsisHorizontal} />
      </button>
      <IonActionSheet
        isOpen={open}
        header="Track options"
        buttons={buttons}
        onDidDismiss={() => setOpen(false)}
      />
      <IonActionSheet
        isOpen={pickOpen}
        header="Add to playlist"
        buttons={pickButtons}
        onDidDismiss={() => setPickOpen(false)}
        data-testid="add-to-playlist-sheet"
      />
      <NewPlaylistAlert open={newOpen} onClose={() => setNewOpen(false)} itemId={track.Id} />
    </>
  );
}
