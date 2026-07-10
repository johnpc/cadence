import { IonIcon } from '@ionic/react';
import { removeCircleOutline } from 'ionicons/icons';

/** The "remove from this list" button on a track row (e.g. remove from a
 * playlist). Stops propagation so it doesn't also play the row. */
export function TrackRemoveButton({ onRemove }: { onRemove: () => void }) {
  return (
    <button
      type="button"
      className="track-row__remove"
      data-testid="track-row-remove"
      aria-label="Remove from playlist"
      onClick={(e) => {
        e.stopPropagation();
        onRemove();
      }}
    >
      <IonIcon icon={removeCircleOutline} />
    </button>
  );
}
