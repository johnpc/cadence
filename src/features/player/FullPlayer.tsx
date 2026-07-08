import { IonModal, IonIcon } from '@ionic/react';
import {
  play,
  pause,
  playSkipBack,
  playSkipForward,
  shuffle as shuffleIcon,
  chevronDown,
} from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { artistLine, formatTime } from './playerFormat';
import { TrackArt } from './TrackArt';
import './fullPlayer.css';

/** The full-screen player modal — art, scrubber, and transport controls. */
export function FullPlayer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const p = usePlayer();
  return (
    <IonModal isOpen={open} onDidDismiss={onClose}>
      <div className="fullplayer" data-testid="full-player">
        <button className="fullplayer__close" onClick={onClose} aria-label="Close player">
          <IonIcon icon={chevronDown} />
        </button>
        <TrackArt item={p.current} size={280} />
        <div className="fullplayer__meta">
          <p className="fullplayer__title cad-headline">{p.current?.Name}</p>
          <p className="fullplayer__artist cad-meta">{artistLine(p.current)}</p>
        </div>
        <div className="fullplayer__scrubber">
          <input
            type="range"
            min={0}
            max={p.duration || 0}
            value={Math.min(p.position, p.duration || 0)}
            onChange={(e) => p.seek(Number(e.target.value))}
            aria-label="Seek"
          />
          <div className="fullplayer__times cad-meta">
            <span>{formatTime(p.position)}</span>
            <span>{formatTime(p.duration)}</span>
          </div>
        </div>
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
          <span className="fullplayer__ctl-spacer" />
        </div>
      </div>
    </IonModal>
  );
}
