import { IonIcon } from '@ionic/react';
import { heart, heartOutline } from 'ionicons/icons';
import { usePlaylistFavorite } from './usePlaylistFavorite';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import '../library/likeButton.css';

/** A heart toggle that favorites/unfavorites a playlist. Hearted playlists
 * bubble to the top of Your Library. Hidden until the playlist has loaded. */
export function PlaylistFavoriteButton({ playlist }: { playlist: JellyfinItem | null }) {
  const { favorite, toggle, busy } = usePlaylistFavorite(playlist);
  if (!playlist) return null;
  return (
    <button
      type="button"
      className={favorite ? 'like-btn like-btn--on' : 'like-btn'}
      style={{ fontSize: 26 }}
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      disabled={busy}
      data-testid="playlist-favorite"
      aria-pressed={favorite}
      aria-label={favorite ? 'Remove playlist from favorites' : 'Add playlist to favorites'}
    >
      <IonIcon icon={favorite ? heart : heartOutline} />
    </button>
  );
}
