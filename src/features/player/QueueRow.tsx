import { IonIcon } from '@ionic/react';
import { arrowUp, arrowDown, closeOutline } from 'ionicons/icons';
import { artistLine } from './playerFormat';
import { TrackArt } from './TrackArt';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** One row of the Up Next queue: jump-to-play, reorder up/down, and remove.
 * Reorder buttons are disabled at the ends so the order can't drift. */
export function QueueRow({
  track,
  index,
  isCurrent,
  isFirst,
  isLast,
  onJump,
  onMove,
  onRemove,
}: {
  track: JellyfinItem;
  index: number;
  isCurrent: boolean;
  isFirst: boolean;
  isLast: boolean;
  onJump: (index: number) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div
      className={isCurrent ? 'queueview__row queueview__row--current' : 'queueview__row'}
      data-testid="queue-row"
    >
      <button
        type="button"
        className="queueview__play"
        data-testid="queue-row-play"
        onClick={() => onJump(index)}
        aria-label={`Play ${track.Name}`}
      >
        <TrackArt item={track} size={40} />
        <span className="queueview__meta">
          <span className="queueview__title">{track.Name}</span>
          <span className="queueview__artist">{artistLine(track)}</span>
        </span>
      </button>
      <button
        type="button"
        className="queueview__move"
        data-testid="queue-row-up"
        aria-label="Move up"
        disabled={isFirst}
        onClick={() => onMove(index, index - 1)}
      >
        <IonIcon icon={arrowUp} />
      </button>
      <button
        type="button"
        className="queueview__move"
        data-testid="queue-row-down"
        aria-label="Move down"
        disabled={isLast}
        onClick={() => onMove(index, index + 1)}
      >
        <IonIcon icon={arrowDown} />
      </button>
      <button
        type="button"
        className="queueview__remove"
        data-testid="queue-row-remove"
        aria-label="Remove from queue"
        onClick={() => onRemove(index)}
      >
        <IonIcon icon={closeOutline} />
      </button>
    </div>
  );
}
