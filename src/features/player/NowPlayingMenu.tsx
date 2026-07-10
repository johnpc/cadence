import { useState } from 'react';
import { IonActionSheet, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { usePlaylists, useAddToPlaylist } from '../playlists/playlistsApi';
import { NewPlaylistAlert } from '../playlists/NewPlaylistAlert';
import { usePlayItem } from './usePlayItem';
import { nowPlayingMenuButtons } from './nowPlayingMenuButtons';
import { addToPlaylistButtons } from '../playlists/trackMenuButtons';
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
  const [pickOpen, setPickOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const history = useHistory();
  const { playlists } = usePlaylists();
  const add = useAddToPlaylist();
  const playItem = usePlayItem();
  const toast = useToast();
  const go = (path: string) => {
    history.push(path);
    onNavigate();
  };
  const buttons = nowPlayingMenuButtons(track, {
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
    addToPlaylist: () => setPickOpen(true),
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
      <IonActionSheet
        isOpen={pickOpen}
        header="Add to playlist"
        buttons={pickButtons}
        onDidDismiss={() => setPickOpen(false)}
        data-testid="np-add-to-playlist-sheet"
      />
      <NewPlaylistAlert open={newOpen} onClose={() => setNewOpen(false)} itemId={track.Id} />
    </>
  );
}
