import { useState } from 'react';
import { IonActionSheet, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import { usePlaylists, useAddToPlaylist } from './playlistsApi';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './addToPlaylist.css';

/** A "…" button that opens an action sheet to add this track to a playlist. */
export function AddToPlaylistButton({ track }: { track: JellyfinItem }) {
  const [open, setOpen] = useState(false);
  const { playlists } = usePlaylists();
  const add = useAddToPlaylist();

  const buttons = [
    ...playlists.map((pl) => ({
      text: pl.Name,
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
        aria-label="Add to playlist"
      >
        <IonIcon icon={ellipsisHorizontal} />
      </button>
      <IonActionSheet
        isOpen={open}
        header="Add to playlist"
        buttons={buttons}
        onDidDismiss={() => setOpen(false)}
      />
    </>
  );
}
