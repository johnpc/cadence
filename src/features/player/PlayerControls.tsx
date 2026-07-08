import { IonIcon } from '@ionic/react';
import {
  play,
  pause,
  playSkipBack,
  playSkipForward,
  shuffle as shuffleIcon,
  repeat as repeatIcon,
} from 'ionicons/icons';
import { usePlayer } from './usePlayer';

/** The transport row: shuffle · prev · play/pause · next · repeat. */
export function PlayerControls() {
  const p = usePlayer();
  return (
    <div className="fullplayer__controls">
      <button
        className={p.shuffle ? 'fullplayer__ctl fullplayer__ctl--on' : 'fullplayer__ctl'}
        onClick={p.toggleShuffle}
        data-testid="full-player-shuffle"
        aria-label="Shuffle"
      >
        <IonIcon icon={shuffleIcon} />
      </button>
      <button
        className="fullplayer__ctl"
        onClick={p.prev}
        disabled={!p.canPrev}
        data-testid="full-player-prev"
        aria-label="Previous"
      >
        <IonIcon icon={playSkipBack} />
      </button>
      <button
        className="fullplayer__ctl fullplayer__ctl--play"
        onClick={p.toggle}
        data-testid="full-player-toggle"
        aria-label={p.isPlaying ? 'Pause' : 'Play'}
      >
        <IonIcon icon={p.isPlaying ? pause : play} />
      </button>
      <button
        className="fullplayer__ctl"
        onClick={p.next}
        disabled={!p.canNext}
        data-testid="full-player-next"
        aria-label="Next"
      >
        <IonIcon icon={playSkipForward} />
      </button>
      <button
        className={p.repeat !== 'off' ? 'fullplayer__ctl fullplayer__ctl--on' : 'fullplayer__ctl'}
        onClick={p.cycleRepeat}
        data-testid="full-player-repeat"
        aria-label={`Repeat ${p.repeat}`}
      >
        <IonIcon icon={repeatIcon} />
        {p.repeat === 'one' && <span className="fullplayer__repeat-one">1</span>}
      </button>
    </div>
  );
}
