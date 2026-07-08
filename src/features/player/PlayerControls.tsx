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

/** The transport row: shuffle · prev · play/pause · next · repeat. `testPrefix`
 * namespaces the testids (default "full-player") so the same controls can be
 * reused in the desktop mini-player without duplicating full-player testids. */
export function PlayerControls({ testPrefix = 'full-player' }: { testPrefix?: string }) {
  const p = usePlayer();
  return (
    <div className="fullplayer__controls">
      <button
        className={p.shuffle ? 'fullplayer__ctl fullplayer__ctl--on' : 'fullplayer__ctl'}
        onClick={p.toggleShuffle}
        data-testid={`${testPrefix}-shuffle`}
        aria-label="Shuffle"
      >
        <IonIcon icon={shuffleIcon} />
      </button>
      <button
        className="fullplayer__ctl"
        onClick={p.prev}
        disabled={!p.canPrev}
        data-testid={`${testPrefix}-prev`}
        aria-label="Previous"
      >
        <IonIcon icon={playSkipBack} />
      </button>
      <button
        className="fullplayer__ctl fullplayer__ctl--play"
        onClick={p.toggle}
        data-testid={`${testPrefix}-toggle`}
        aria-label={p.isPlaying ? 'Pause' : 'Play'}
      >
        <IonIcon icon={p.isPlaying ? pause : play} />
      </button>
      <button
        className="fullplayer__ctl"
        onClick={p.next}
        disabled={!p.canNext}
        data-testid={`${testPrefix}-next`}
        aria-label="Next"
      >
        <IonIcon icon={playSkipForward} />
      </button>
      <button
        className={p.repeat !== 'off' ? 'fullplayer__ctl fullplayer__ctl--on' : 'fullplayer__ctl'}
        onClick={p.cycleRepeat}
        data-testid={`${testPrefix}-repeat`}
        aria-label={`Repeat ${p.repeat}`}
      >
        <IonIcon icon={repeatIcon} />
        {p.repeat === 'one' && <span className="fullplayer__repeat-one">1</span>}
      </button>
    </div>
  );
}
