import { IonIcon } from '@ionic/react';
import { checkmarkCircle, addCircleOutline } from 'ionicons/icons';
import { useSaveToggle } from './useSaveToggle';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './saveButton.css';

/** A save toggle for a whole album/artist (a Spotify "Save"/"Follow"). Shows a
 * filled check when saved, an outline plus when not. The confirmation/error
 * toast is owned by useSaveToggle (fired on the mutation's REAL outcome), so a
 * failed save no longer shows a false-success toast alongside the error one. */
export function SaveButton({ item, size = 30 }: { item: JellyfinItem | null; size?: number }) {
  const { saved, toggle, busy } = useSaveToggle(item);
  const isArtist = item?.Type === 'MusicArtist';
  const label = isArtist
    ? saved
      ? 'Unfollow'
      : 'Follow'
    : saved
      ? 'Remove from library'
      : 'Add to library';
  return (
    <button
      type="button"
      className={saved ? 'save-btn save-btn--on' : 'save-btn'}
      style={{ fontSize: size }}
      onClick={(e) => {
        e.stopPropagation();
        toggle();
      }}
      disabled={busy || !item}
      data-testid="save-button"
      aria-pressed={saved}
      aria-label={label}
    >
      <IonIcon icon={saved ? checkmarkCircle : addCircleOutline} />
    </button>
  );
}
