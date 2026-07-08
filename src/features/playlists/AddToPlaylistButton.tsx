import { useState } from 'react';
import { IonActionSheet, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { usePlaylists, useAddToPlaylist } from './playlistsApi';
import { usePlayer } from '../player/usePlayer';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './addToPlaylist.css';

/** A "…" track menu: play next, add to queue, go to album/artist, add to playlist. */
export function AddToPlaylistButton({ track }: { track: JellyfinItem }) {
  const [open, setOpen] = useState(false);
  const { playlists } = usePlaylists();
  const add = useAddToPlaylist();
  const { playNext, addToQueue } = usePlayer();
  const history = useHistory();
  const artist = track.ArtistItems?.[0];

  const buttons = [
    { text: 'Play next', handler: () => playNext(track) },
    { text: 'Add to queue', handler: () => addToQueue(track) },
    ...(track.AlbumId
      ? [{ text: 'Go to album', handler: () => history.push(`/album/${track.AlbumId}`) }]
      : []),
    ...(artist
      ? [{ text: 'Go to artist', handler: () => history.push(`/artist/${artist.Id}`) }]
      : []),
    ...playlists.map((pl) => ({
      text: `Add to ${pl.Name}`,
      handler: () => add.mutate({ playlistId: pl.Id, itemId: track.Id }),
    })),
    { text: 'Cancel', role: 'cancel' as const },
  ];

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
    </>
  );
}
