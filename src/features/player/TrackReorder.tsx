import { IonIcon } from '@ionic/react';
import { arrowUp, arrowDown } from 'ionicons/icons';

/** Up/down reorder controls for a track row (used in editable playlists).
 * Buttons disable at the ends so the order can't drift out of range. */
export function TrackReorder({
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: {
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className="track-row__move"
        data-testid="track-row-up"
        aria-label="Move up"
        disabled={isFirst}
        onClick={(e) => {
          e.stopPropagation();
          onMoveUp();
        }}
      >
        <IonIcon icon={arrowUp} />
      </button>
      <button
        type="button"
        className="track-row__move"
        data-testid="track-row-down"
        aria-label="Move down"
        disabled={isLast}
        onClick={(e) => {
          e.stopPropagation();
          onMoveDown();
        }}
      >
        <IonIcon icon={arrowDown} />
      </button>
    </>
  );
}
