import { useState } from 'react';
import { IonActionSheet, IonAlert, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { usePlaylists, useAddToPlaylist } from './playlistsApi';
import { useCreatePlaylistWithItems } from './playlistCreate';
import { trackMenuButtons } from './trackMenuButtons';
import { usePlayer } from '../player/usePlayer';
import { useToast } from '../toast/useToast';
import { copyShareLink } from '../share/shareLink';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './addToPlaylist.css';

/** A "…" track menu: play next, add to queue, go to album/artist, copy link,
 * create a new playlist with this track, or add it to an existing one. */
export function AddToPlaylistButton({ track }: { track: JellyfinItem }) {
  const [open, setOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const { playlists } = usePlaylists();
  const add = useAddToPlaylist();
  const createWith = useCreatePlaylistWithItems();
  const { playNext, addToQueue } = usePlayer();
  const toast = useToast();
  const history = useHistory();

  const buttons = trackMenuButtons(track, playlists, {
    playNext: () => {
      playNext(track);
      toast('Playing next');
    },
    addToQueue: () => {
      addToQueue(track);
      toast('Added to queue');
    },
    goToAlbum: () => history.push(`/album/${track.AlbumId}`),
    goToArtist: () => history.push(`/artist/${track.ArtistItems?.[0]?.Id}`),
    copyLink: () =>
      void copyShareLink(track, window.location.origin).then((ok) =>
        toast(ok ? 'Link copied' : 'Could not copy link'),
      ),
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
      <IonAlert
        isOpen={newOpen}
        header="New playlist"
        inputs={[{ name: 'name', type: 'text', placeholder: 'Playlist name' }]}
        buttons={[
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Create',
            handler: (data: { name?: string }) => {
              const name = (data.name ?? '').trim();
              if (name) {
                createWith.mutate({ name, itemIds: [track.Id] });
                toast(`Created "${name}"`);
              }
            },
          },
        ]}
        onDidDismiss={() => setNewOpen(false)}
      />
    </>
  );
}
