import { useState } from 'react';
import { IonActionSheet, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { usePlaylists, useAddToPlaylist } from './playlistsApi';
import { trackMenuButtons, addToPlaylistButtons } from './trackMenuButtons';
import { NewPlaylistAlert } from './NewPlaylistAlert';
import { usePlayer } from '../player/usePlayer';
import { usePlayItem } from '../player/usePlayItem';
import { useToast } from '../toast/useToast';
import { copyShareLink } from '../share/shareLink';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './addToPlaylist.css';

/** A "…" track menu: play next, add to queue, "Add to playlist…" (opens a
 * dedicated picker), go to album/artist, copy link. */
export function AddToPlaylistButton({ track }: { track: JellyfinItem }) {
  const [open, setOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const { playlists } = usePlaylists();
  const add = useAddToPlaylist();
  const { playNext, addToQueue } = usePlayer();
  const playItem = usePlayItem();
  const toast = useToast();
  const history = useHistory();

  const buttons = trackMenuButtons(track, {
    playNext: () => {
      playNext(track);
      toast('Playing next');
    },
    addToQueue: () => {
      addToQueue(track);
      toast('Added to queue');
    },
    addToPlaylist: () => setPickOpen(true),
    startRadio: () => {
      void playItem(track);
      toast('Starting radio');
    },
    goToAlbum: () => history.push(`/album/${track.AlbumId}`),
    goToArtist: () => history.push(`/artist/${track.ArtistItems?.[0]?.Id}`),
    copyLink: () =>
      void copyShareLink(track, window.location.origin).then((ok) =>
        toast(ok ? 'Link copied' : 'Could not copy link'),
      ),
  });

  const pickButtons = addToPlaylistButtons(playlists, {
    newPlaylist: () => setNewOpen(true),
    addTo: (pl) => {
      add.mutate({ playlistId: pl.Id, itemId: track.Id });
      toast(`Added to ${pl.Name}`);
    },
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
