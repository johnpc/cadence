import { IonModal, IonIcon } from '@ionic/react';
import { chevronDown } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { QueueRow } from './QueueRow';
import './queueView.css';

/** The "Up Next" queue — the full play order, current track marked, tap to jump,
 * reorder with up/down, and remove any track from the queue. */
export function QueueView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { queue, queueIndex, jumpTo, removeFromQueue, moveInQueue, clearQueue } = usePlayer();
  const hasUpcoming = queue.length - 1 > queueIndex;
  const jump = (index: number) => {
    jumpTo(index);
    onClose();
  };
  return (
    <IonModal isOpen={open} onDidDismiss={onClose}>
      <div className="queueview" data-testid="queue-view">
        <div className="queueview__head">
          <button className="queueview__close" onClick={onClose} aria-label="Close queue">
            <IonIcon icon={chevronDown} />
          </button>
          <h2 className="cad-headline">Up next</h2>
          {hasUpcoming && (
            <button
              type="button"
              className="queueview__clear"
              data-testid="queue-clear"
              onClick={clearQueue}
            >
              Clear
            </button>
          )}
        </div>
        <div className="queueview__list">
          {queue.map((track, index) => (
            <div key={`${track.Id}-${index}`}>
              {index === queueIndex && (
                <h3 className="cad-kicker queueview__section">Now playing</h3>
              )}
              {index === queueIndex + 1 && (
                <h3 className="cad-kicker queueview__section">Next up</h3>
              )}
              <QueueRow
                track={track}
                index={index}
                isCurrent={index === queueIndex}
                isFirst={index === 0}
                isLast={index === queue.length - 1}
                onJump={jump}
                onMove={moveInQueue}
                onRemove={removeFromQueue}
              />
            </div>
          ))}
        </div>
      </div>
    </IonModal>
  );
}
