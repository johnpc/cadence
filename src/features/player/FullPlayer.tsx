import { IonModal, IonIcon } from '@ionic/react';
import {
  chevronDown,
  listOutline,
  volumeLow,
  volumeHigh,
  documentTextOutline,
} from 'ionicons/icons';
import { useState } from 'react';
import { QueueView } from './QueueView';
import { LyricsSheet } from './LyricsSheet';
import { NowPlayingMenu } from './NowPlayingMenu';
import { PlayerControls } from './PlayerControls';
import { usePlayer } from './usePlayer';
import { artistLine, formatTime } from './playerFormat';
import { TrackArt } from './TrackArt';
import { LikeButton } from '../library/LikeButton';
import './fullPlayer.css';

/** The full-screen player modal — art, scrubber, and transport controls. */
export function FullPlayer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const p = usePlayer();
  const [queueOpen, setQueueOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  return (
    <IonModal isOpen={open} onDidDismiss={onClose}>
      <div className="fullplayer" data-testid="full-player">
        <button className="fullplayer__close" onClick={onClose} aria-label="Close player">
          <IonIcon icon={chevronDown} />
        </button>
        <TrackArt item={p.current} size={280} />
        <div className="fullplayer__meta">
          <div className="fullplayer__titles">
            <p className="fullplayer__title cad-headline">{p.current?.Name}</p>
            <p className="fullplayer__artist cad-meta">{artistLine(p.current)}</p>
          </div>
          {p.current && <LikeButton track={p.current} size={26} />}
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
        <PlayerControls />
        <div className="fullplayer__volume">
          <IonIcon icon={volumeLow} aria-hidden="true" />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={p.volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
            aria-label="Volume"
            data-testid="full-player-volume"
          />
          <IonIcon icon={volumeHigh} aria-hidden="true" />
        </div>
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
        <QueueView open={queueOpen} onClose={() => setQueueOpen(false)} />
        <LyricsSheet open={lyricsOpen} onClose={() => setLyricsOpen(false)} />
      </div>
    </IonModal>
  );
}
