import { useEffect, useState } from 'react';
import { IonIcon } from '@ionic/react';
import { play, pause } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { usePlayerProgress } from './PlayerProgressContext';
import { artistLine } from './playerFormat';
import { TrackArt } from './TrackArt';
import { FullPlayer } from './FullPlayer';
import { NowPlayingExtras } from './NowPlayingExtras';
import { LikeButton } from '../library/LikeButton';
import './nowPlayingBar.css';

/** Persistent mini-player above the tab bar. Tap to open the full player. */
export function NowPlayingBar() {
  const { current, isPlaying, toggle, seek } = usePlayer();
  const { position, duration } = usePlayerProgress();
  const [open, setOpen] = useState(false);

  // Flag the document while a track is loaded so scroll views can reserve
  // bottom space and their last row isn't hidden behind the fixed mini-player.
  useEffect(() => {
    document.body.classList.toggle('has-now-playing', !!current);
    return () => document.body.classList.remove('has-now-playing');
  }, [current]);

  if (!current) return null;

  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <>
      <div className="npbar" data-testid="now-playing-bar">
        <button
          className="npbar__open"
          onClick={() => setOpen(true)}
          data-testid="now-playing-open"
        >
          <TrackArt item={current} size={40} />
          <span className="npbar__meta">
            <span className="npbar__title" data-testid="now-playing-title">
              {current.Name}
            </span>
            <span className="npbar__artist">{artistLine(current)}</span>
          </span>
        </button>
        <LikeButton track={current} size={22} />
        <NowPlayingExtras />
        <button
          className="npbar__play"
          onClick={toggle}
          data-testid="now-playing-toggle"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <IonIcon icon={isPlaying ? pause : play} />
        </button>
        <div className="npbar__progress" data-testid="now-playing-progress">
          <div className="npbar__progress-fill" style={{ width: `${pct}%` }} />
          <input
            className="npbar__seek"
            type="range"
            min={0}
            max={duration || 0}
            value={Math.min(position, duration || 0)}
            onChange={(e) => seek(Number(e.target.value))}
            aria-label="Seek"
            data-testid="now-playing-seek"
          />
        </div>
      </div>
      <FullPlayer open={open} onClose={() => setOpen(false)} />
    </>
  );
}
