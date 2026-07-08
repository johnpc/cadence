import { IonIcon } from '@ionic/react';
import { checkmarkCircle, addCircleOutline } from 'ionicons/icons';
import { useSaveToggle } from './useSaveToggle';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './saveButton.css';

/** A save toggle for a whole album/artist (a Spotify "Save"/"Follow"). Shows a
 * filled check when saved, an outline plus when not. */
export function SaveButton({ item, size = 30 }: { item: JellyfinItem | null; size?: number }) {
  const { saved, toggle, busy } = useSaveToggle(item);
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
      aria-label={saved ? 'Remove from library' : 'Add to library'}
    >
      <IonIcon icon={saved ? checkmarkCircle : addCircleOutline} />
    </button>
  );
}
