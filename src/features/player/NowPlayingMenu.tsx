import { useState } from 'react';
import { IonActionSheet, IonAlert, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { usePlaylists, useAddToPlaylist } from '../playlists/playlistsApi';
import { useCreatePlaylistWithItems } from '../playlists/playlistCreate';
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
  const toast = useToast();
  const go = (path: string) => {
    history.push(path);
    onNavigate();
  };
  const artist = track.ArtistItems?.[0];
  const buttons = [
    { text: 'Go to song', handler: () => go(`/song/${track.Id}`) },
    ...(track.AlbumId
      ? [{ text: 'Go to album', handler: () => go(`/album/${track.AlbumId}`) }]
      : []),
    ...(artist ? [{ text: 'Go to artist', handler: () => go(`/artist/${artist.Id}`) }] : []),
    {
      text: 'Copy link',
      handler: () => {
        void copyShareLink(track, window.location.origin).then((ok) =>
          toast(ok ? 'Link copied' : 'Could not copy link'),
        );
      },
    },
    { text: 'New playlist…', handler: () => setNewOpen(true) },
    ...playlists.map((pl) => ({
      text: `Add to ${pl.Name}`,
      handler: () => {
        add.mutate({ playlistId: pl.Id, itemId: track.Id });
        toast(`Added to ${pl.Name}`);
      },
    })),
    { text: 'Cancel', role: 'cancel' as const },
  ];
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
