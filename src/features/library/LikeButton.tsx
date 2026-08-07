import { IonIcon } from '@ionic/react';
import { heart, heartOutline } from 'ionicons/icons';
import { useLikeToggle } from './useLikeToggle';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './likeButton.css';

/** A heart toggle that likes/unlikes any favoritable item (Jellyfin favorite).
 * `extraKeys` refreshes the caller's own list on success (e.g. the playlists
 * list, so a hearted playlist re-orders); `noun` tunes the aria/toast wording. */
export function LikeButton({
  track,
  size = 22,
  extraKeys,
  noun = 'liked songs',
}: {
  track: JellyfinItem;
  size?: number;
  extraKeys?: readonly unknown[][];
  noun?: string;
}) {
  const { liked, toggle, busy } = useLikeToggle(track, extraKeys);
  return (
    <button
      type="button"
      className={liked ? 'like-btn like-btn--on' : 'like-btn'}
      style={{ fontSize: size }}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle();
      }}
      disabled={busy}
      data-testid="like-button"
      aria-pressed={liked}
      aria-label={liked ? `Remove from ${noun}` : `Add to ${noun}`}
    >
      <IonIcon icon={liked ? heart : heartOutline} />
    </button>
  );
}
