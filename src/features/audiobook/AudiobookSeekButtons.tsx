import { IonIcon } from '@ionic/react';
import { playBack, playForward } from 'ionicons/icons';
import { usePlayer } from '../player/usePlayer';
import { usePlayerProgress } from '../player/PlayerProgressContext';
import { isAudiobook } from './isAudiobook';
import { SpeedControl } from './SpeedControl';
import './audiobookSeek.css';

/** Skip amount in seconds — the audiobook convention (small nudge to re-hear or
 * skip a beat, distinct from chapter jumps in the chapter sheet). */
const SKIP = 30;

/** ±30s skip buttons shown under the scrubber for audiobooks — the primary
 * audiobook seek gesture (re-hear a sentence / skip ahead) — with the speed pill
 * between them: the same control as the read-along sheet, so speed looks and
 * works one way everywhere (it replaced a full-width slider row). Renders nothing
 * for music, where track prev/next is the right control. */
export function AudiobookSeekButtons() {
  const { current, seek, rate, setRate } = usePlayer();
  const { position, duration } = usePlayerProgress();
  if (!isAudiobook(current)) return null;

  const back = () => seek(Math.max(0, position - SKIP));
  const forward = () => seek(Math.min(duration || position + SKIP, position + SKIP));

  return (
    <div className="ab-seek" data-testid="audiobook-seek">
      <button className="ab-seek__btn" onClick={back} aria-label="Back 30 seconds">
        <IonIcon icon={playBack} />
        <span className="ab-seek__label">30</span>
      </button>
      <SpeedControl rate={rate} onRate={setRate} testPrefix="full-player-" />
      <button className="ab-seek__btn" onClick={forward} aria-label="Forward 30 seconds">
        <span className="ab-seek__label">30</span>
        <IonIcon icon={playForward} />
      </button>
    </div>
  );
}
