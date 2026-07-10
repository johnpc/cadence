import { IonModal, IonIcon, IonReorderGroup, type ItemReorderEventDetail } from '@ionic/react';
import { chevronDown } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { usePlayContext } from './usePlayContext';
import { QueueRow } from './QueueRow';
import { SaveQueueButton } from './SaveQueueButton';
import './queueView.css';

/** The "Up Next" queue — the full play order, current track marked, tap to jump,
 * drag to reorder (Spotify-style; up/down buttons remain for accessibility), and
 * remove any track from the queue. */
export function QueueView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { queue, queueIndex, current, jumpTo, removeFromQueue, moveInQueue, clearQueue } =
    usePlayer();
  const ctx = usePlayContext(current?.Id);
  const hasUpcoming = queue.length - 1 > queueIndex;
  const jump = (index: number) => {
    jumpTo(index);
    onClose();
  };
  // Ionic drag reorder: complete(false) tells Ionic NOT to touch the DOM — React
  // owns the list, so we apply the move to our own state (moveInQueue) instead.
  const onReorder = (e: CustomEvent<ItemReorderEventDetail>) => {
    e.detail.complete(false);
    moveInQueue(e.detail.from, e.detail.to);
  };
  return (
    <IonModal isOpen={open} onDidDismiss={onClose}>
      <div className="queueview" data-testid="queue-view">
        <div className="queueview__head">
          <button className="queueview__close" onClick={onClose} aria-label="Close queue">
            <IonIcon icon={chevronDown} />
          </button>
          <div className="queueview__titles">
            <h2 className="cad-headline">Up next</h2>
            {ctx && (
              <p className="queueview__from cad-meta" data-testid="queue-playing-from">
                Playing from {ctx.kind} · {ctx.label}
              </p>
            )}
          </div>
          <SaveQueueButton queue={queue} />
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
        {queue.length === 0 && (
          <p className="queueview__empty cad-meta" data-testid="queue-empty">
            Your queue is empty. Play something to build it up.
          </p>
        )}
        <div className="queueview__list">
          <IonReorderGroup disabled={false} onIonItemReorder={onReorder}>
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
          </IonReorderGroup>
        </div>
      </div>
    </IonModal>
  );
}
