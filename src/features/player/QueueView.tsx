import { IonModal, IonIcon } from '@ionic/react';
import { chevronDown, closeOutline } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { artistLine } from './playerFormat';
import { TrackArt } from './TrackArt';
import './queueView.css';

/** The "Up Next" queue — the full play order, current track marked, tap to jump,
 * and remove any track from the queue. */
export function QueueView({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { queue, queueIndex, jumpTo, removeFromQueue } = usePlayer();
  return (
    <IonModal isOpen={open} onDidDismiss={onClose}>
      <div className="queueview" data-testid="queue-view">
        <div className="queueview__head">
          <button className="queueview__close" onClick={onClose} aria-label="Close queue">
            <IonIcon icon={chevronDown} />
          </button>
          <h2 className="cad-headline">Up next</h2>
        </div>
        <div className="queueview__list">
          {queue.map((track, index) => (
            <div
              key={`${track.Id}-${index}`}
              className={
                index === queueIndex ? 'queueview__row queueview__row--current' : 'queueview__row'
              }
              data-testid="queue-row"
            >
              <button
                type="button"
                className="queueview__play"
                data-testid="queue-row-play"
                onClick={() => {
                  jumpTo(index);
                  onClose();
                }}
              >
                <TrackArt item={track} size={40} />
                <span className="queueview__meta">
                  <span className="queueview__title">{track.Name}</span>
                  <span className="queueview__artist">{artistLine(track)}</span>
                </span>
              </button>
              <button
                type="button"
                className="queueview__remove"
                data-testid="queue-row-remove"
                aria-label="Remove from queue"
                onClick={() => removeFromQueue(index)}
              >
                <IonIcon icon={closeOutline} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </IonModal>
  );
}
