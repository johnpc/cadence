import { IonModal, IonIcon } from '@ionic/react';
import { chevronDown, listOutline, documentTextOutline } from 'ionicons/icons';
import { useState } from 'react';
import { AmbientBackground } from './AmbientBackground';
import { QueueView } from './QueueView';
import { LyricsSheet } from './LyricsSheet';
import { NowPlayingMenu } from './NowPlayingMenu';
import { NextUpHint } from './NextUpHint';
import { PlayerControls } from './PlayerControls';
import { VolumeSlider } from './VolumeSlider';
import { PlayingFrom } from './PlayingFrom';
import { FullPlayerTitle } from './FullPlayerTitle';
import { usePlayer } from './usePlayer';
import { usePlayerProgress } from './PlayerProgressContext';
import { useScrubber } from './useScrubber';
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
  return (
    <IonModal isOpen={open} onDidDismiss={onClose}>
      <div className="fullplayer" data-testid="full-player">
        <AmbientBackground item={p.current} />
        <button className="fullplayer__close" onClick={onClose} aria-label="Close player">
          <IonIcon icon={chevronDown} />
        </button>
        <PlayingFrom trackId={p.current?.Id} />
        <TrackArt item={p.current} size={280} />
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
          />
          <div className="fullplayer__times cad-meta">
            <span>{formatTime(scrub.value)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <PlayerControls />
        <VolumeSlider volume={p.volume} setVolume={p.setVolume} />
        <div className="fullplayer__footer">
          <button
            className="fullplayer__foot-btn"
            onClick={() => setLyricsOpen(true)}
            data-testid="full-player-lyrics"
          >
            <IonIcon icon={documentTextOutline} /> Lyrics
          </button>
          <button
            className="fullplayer__foot-btn"
            onClick={() => setQueueOpen(true)}
            data-testid="full-player-queue"
          >
            <IonIcon icon={listOutline} /> Up next
          </button>
          {p.current && <NowPlayingMenu track={p.current} onNavigate={onClose} />}
        </div>
        <NextUpHint onOpenQueue={() => setQueueOpen(true)} />
        <QueueView open={queueOpen} onClose={() => setQueueOpen(false)} />
        <LyricsSheet open={lyricsOpen} onClose={() => setLyricsOpen(false)} />
      </div>
    </IonModal>
  );
}
