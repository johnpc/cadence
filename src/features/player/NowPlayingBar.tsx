import { useEffect, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { play, pause, playSkipForward } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { useCast } from '../cast/useCast';
import { usePlayerProgress } from './PlayerProgressContext';
import { useScrubber } from './useScrubber';
import { formatTime } from './playerFormat';
import { NowPlayingMeta } from './NowPlayingMeta';
import { FullPlayer } from './FullPlayer';
import { NowPlayingExtras } from './NowPlayingExtras';
import { LikeButton } from '../library/LikeButton';
import { useCastSync } from '../cast/useCastSync';
import { useCastLyrics } from '../cast/useCastLyrics';
import './nowPlayingBar.css';

/** Persistent mini-player above the tab bar. Tap to open the full player. */
export function NowPlayingBar() {
  const { current, isPlaying, waiting, canNext, next, toggle, seek } = usePlayer();
  const { connected: casting, deviceName } = useCast();
  const { position, duration } = usePlayerProgress();
  const scrub = useScrubber(position, seek);
  const [open, setOpen] = useState(false);
  // While casting to a custom receiver, mirror now-playing + queue + lyrics to
  // the TV.
  useCastSync();
  useCastLyrics();

  // Flag the document while a track is loaded so scroll views can reserve
  // bottom space and their last row isn't hidden behind the fixed mini-player.
  useEffect(() => {
    document.body.classList.toggle('has-now-playing', !!current);
    return () => document.body.classList.remove('has-now-playing');
  }, [current]);

  if (!current) return null;

  const pct = duration > 0 ? Math.min(100, (scrub.value / duration) * 100) : 0;

  return (
    <>
      <div className="npbar" data-testid="now-playing-bar">
        <NowPlayingMeta
          track={current}
          casting={casting}
          deviceName={deviceName}
          onOpen={() => setOpen(true)}
        />
        <LikeButton track={current} size={22} />
        <NowPlayingExtras />
        <button
          className="npbar__play"
          onClick={toggle}
          data-testid="now-playing-toggle"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {waiting ? (
            <IonSpinner name="crescent" data-testid="now-playing-buffering" />
          ) : (
            <IonIcon icon={isPlaying ? pause : play} />
          )}
        </button>
        {/* Skip button — mobile only (desktop has full transport in the extras).
            Hidden ≥768px via CSS to avoid duplicating NowPlayingExtras. */}
        <button
          className="npbar__next"
          onClick={next}
          disabled={!canNext}
          data-testid="now-playing-next"
          aria-label="Next"
        >
          <IonIcon icon={playSkipForward} />
        </button>
        <div className="npbar__progress" data-testid="now-playing-progress">
          <div className="npbar__progress-fill" style={{ width: `${pct}%` }} />
          <input
            className="npbar__seek"
            type="range"
            min={0}
            max={duration || 0}
            value={Math.min(scrub.value, duration || 0)}
            onChange={(e) => scrub.onInput(Number(e.currentTarget.value))}
            onPointerUp={scrub.onCommit}
            onKeyUp={scrub.onCommit}
            onBlur={scrub.onCommit}
            aria-label="Seek"
            aria-valuetext={`${formatTime(scrub.value)} of ${formatTime(duration)}`}
            data-testid="now-playing-seek"
          />
        </div>
      </div>
      <FullPlayer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
