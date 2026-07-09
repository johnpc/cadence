import { useState } from 'react';
import { IonActionSheet, IonAlert, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { usePlaylists, useAddToPlaylist } from '../playlists/playlistsApi';
import { useCreatePlaylistWithItems } from '../playlists/playlistCreate';
import { usePlayItem } from './usePlayItem';
import { nowPlayingMenuButtons } from './nowPlayingMenuButtons';
import { useToast } from '../toast/useToast';
import { copyShareLink } from '../share/shareLink';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The now-playing "…" menu: jump to the current track's song/album/artist,
 * copy its link, or add it to a new or existing playlist, then close the full
 * player so the destination shows. */
export function NowPlayingMenu({
  track,
  onNavigate,
}: {
  track: JellyfinItem;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const history = useHistory();
  const { playlists } = usePlaylists();
  const add = useAddToPlaylist();
  const createWith = useCreatePlaylistWithItems();
  const playItem = usePlayItem();
  const toast = useToast();
  const go = (path: string) => {
    history.push(path);
    onNavigate();
  };
  const buttons = nowPlayingMenuButtons(track, playlists, {
    goToSong: () => go(`/song/${track.Id}`),
    startRadio: () => {
      void playItem(track);
      toast('Starting radio');
    },
    goToAlbum: () => go(`/album/${track.AlbumId}`),
    goToArtist: () => go(`/artist/${track.ArtistItems?.[0]?.Id}`),
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
        className="fullplayer__foot-btn"
        onClick={() => setOpen(true)}
        data-testid="full-player-more"
        aria-label="More options"
      >
        <IonIcon icon={ellipsisHorizontal} /> More
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
