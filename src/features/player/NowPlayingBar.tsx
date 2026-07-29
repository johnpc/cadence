import { useEffect, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { play, pause, playSkipForward, chevronDown } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { useNowPlayingDismiss } from './useNowPlayingDismiss';
import { useCast } from '../cast/useCast';
import { usePlayerProgress } from './PlayerProgressContext';
import { useScrubber } from './useScrubber';
import { NowPlayingSeek } from './NowPlayingSeek';
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
  // Let the user hide the bar to browse; it returns when a new track starts.
  const { dismissed, dismiss } = useNowPlayingDismiss(current?.Id);
  // While casting to a custom receiver, mirror now-playing + queue + lyrics to
  // the TV.
  useCastSync();
  useCastLyrics();

  // Flag the document while a track is loaded so scroll views can reserve
  // bottom space and their last row isn't hidden behind the fixed mini-player.
  useEffect(() => {
    document.body.classList.toggle('has-now-playing', !!current && !dismissed);
    return () => document.body.classList.remove('has-now-playing');
  }, [current, dismissed]);

  if (!current || dismissed) return null;

  return (
    <>
      <div className="npbar" data-testid="now-playing-bar">
        <NowPlayingMeta
          track={current}
          casting={casting}
          deviceName={deviceName}
          onOpen={() => setOpen(true)}
        />
        <button
          className="npbar__dismiss"
          onClick={dismiss}
          aria-label="Hide player"
          data-testid="now-playing-dismiss"
        >
          <IonIcon icon={chevronDown} />
        </button>
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
        {/* Skip — mobile only (hidden ≥768px; desktop uses NowPlayingExtras). */}
        <button
          className="npbar__next"
          onClick={next}
          disabled={!canNext}
          data-testid="now-playing-next"
          aria-label="Next"
        >
          <IonIcon icon={playSkipForward} />
        </button>
        <NowPlayingSeek scrub={scrub} duration={duration} />
      </div>
      <FullPlayer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
