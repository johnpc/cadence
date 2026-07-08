import { useState } from 'react';
import { IonActionSheet, IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { usePlaylists, useAddToPlaylist } from '../playlists/playlistsApi';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The now-playing "…" menu: jump to the current track's album or artist, or
 * add it to a playlist, then close the full player so the destination shows. */
export function NowPlayingMenu({
  track,
  onNavigate,
}: {
  track: JellyfinItem;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const history = useHistory();
  const { playlists } = usePlaylists();
  const add = useAddToPlaylist();
  const go = (path: string) => {
    history.push(path);
    onNavigate();
  };
  const artist = track.ArtistItems?.[0];
  const buttons = [
    ...(track.AlbumId
      ? [{ text: 'Go to album', handler: () => go(`/album/${track.AlbumId}`) }]
      : []),
    ...(artist ? [{ text: 'Go to artist', handler: () => go(`/artist/${artist.Id}`) }] : []),
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
    </>
  );
}
