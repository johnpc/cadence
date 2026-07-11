import { IonModal, IonIcon } from '@ionic/react';
import { chevronDown } from 'ionicons/icons';
import { useState } from 'react';
import { AmbientBackground } from './AmbientBackground';
import { QueueView } from './QueueView';
import { LyricsSheet } from './LyricsSheet';
import { FullPlayerFooter } from './FullPlayerFooter';
import { CastingBanner } from '../cast/CastingBanner';
import { SleepIndicator } from './SleepIndicator';
import { NextUpHint } from './NextUpHint';
import { PlayerControls } from './PlayerControls';
import { VolumeSlider } from './VolumeSlider';
import { PlayingFrom } from './PlayingFrom';
import { FullPlayerTitle } from './FullPlayerTitle';
import { usePlayer } from './usePlayer';
import { usePlayerProgress } from './PlayerProgressContext';
import { useScrubber } from './useScrubber';
import { useSwipe } from './useSwipe';
import { useDismissSwipe } from './useDismissSwipe';
import { formatTime } from './playerFormat';
import { TrackArt } from './TrackArt';
import './fullPlayer.css';

/** The full-screen player modal — art, scrubber, and transport controls. */
export function FullPlayer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const p = usePlayer();
  const { position, duration } = usePlayerProgress();
  const scrub = useScrubber(position, p.seek);
  const [queueOpen, setQueueOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  // Swipe the art left/right to skip — a signature now-playing gesture. Guarded
  // by canNext/canPrev so a swipe at the queue's edge is a no-op.
  const swipe = useSwipe(
    () => p.canNext && p.next(),
    () => p.canPrev && p.prev(),
  );
  const dismiss = useDismissSwipe(onClose);
  return (
    <IonModal isOpen={open} onDidDismiss={onClose}>
      <div className="fullplayer" data-testid="full-player">
        <AmbientBackground item={p.current} />
        <div className="fullplayer__grab" data-testid="full-player-grab" {...dismiss}>
          <span className="fullplayer__grab-handle" aria-hidden="true" />
          <button className="fullplayer__close" onClick={onClose} aria-label="Close player">
            <IonIcon icon={chevronDown} />
          </button>
        </div>
        <PlayingFrom trackId={p.current?.Id} onNavigate={onClose} />
        <CastingBanner />
        <SleepIndicator />
        <div className="fullplayer__art" data-testid="full-player-art" {...swipe}>
          <TrackArt item={p.current} size={280} />
        </div>
        <FullPlayerTitle track={p.current} onNavigate={onClose} />
        <div className="fullplayer__scrubber">
          <input
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
          />
          <div className="fullplayer__times cad-meta">
            <span>{formatTime(scrub.value)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <PlayerControls />
        <VolumeSlider volume={p.volume} setVolume={p.setVolume} />
        <FullPlayerFooter
          current={p.current}
          onOpenLyrics={() => setLyricsOpen(true)}
          onOpenQueue={() => setQueueOpen(true)}
          onClose={onClose}
        />
        <NextUpHint onOpenQueue={() => setQueueOpen(true)} />
        <QueueView open={queueOpen} onClose={() => setQueueOpen(false)} />
        <LyricsSheet open={lyricsOpen} onClose={() => setLyricsOpen(false)} />
      </div>
    </IonModal>
  );
}
