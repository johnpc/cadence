import { IonIcon } from '@ionic/react';
import { heart, heartOutline } from 'ionicons/icons';
import { useLikeToggle } from './useLikeToggle';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './likeButton.css';

/** A heart toggle that likes/unlikes a track (Jellyfin favorite). */
export function LikeButton({ track, size = 22 }: { track: JellyfinItem; size?: number }) {
  const { liked, toggle, busy } = useLikeToggle(track);
  return (
    <button
      type="button"
      className={liked ? 'like-btn like-btn--on' : 'like-btn'}
      style={{ fontSize: size }}
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      disabled={busy}
      data-testid="like-button"
      aria-pressed={liked}
      aria-label={liked ? 'Remove from liked songs' : 'Add to liked songs'}
    >
      <IonIcon icon={liked ? heart : heartOutline} />
    </button>
  );
}
