import { useState } from 'react';
import { IonIcon } from '@ionic/react';
import { listOutline, documentTextOutline, volumeHigh, volumeMute } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { PlayerControls } from './PlayerControls';
import { QueueView } from './QueueView';
import { LyricsSheet } from './LyricsSheet';

/** Desktop-only mini-player extras: full transport (via PlayerControls) plus
 * queue, lyrics, and a volume/mute control. Hidden on mobile via CSS — phones
 * open the full player for these. Hosts its own queue + lyrics modals. */
export function NowPlayingExtras() {
  const { volume, setVolume } = usePlayer();
  const [queueOpen, setQueueOpen] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [premute, setPremute] = useState(1);
  const muted = volume === 0;
  const toggleMute = () => {
    if (muted) setVolume(premute || 1);
    else {
      setPremute(volume);
      setVolume(0);
    }
  };
  return (
    <div className="npbar__extras" data-testid="now-playing-extras">
      <PlayerControls testPrefix="npbar" />
      <button
        className="npbar__extra"
        onClick={() => setLyricsOpen(true)}
        data-testid="npbar-lyrics"
        aria-label="Lyrics"
      >
        <IonIcon icon={documentTextOutline} />
      </button>
      <button
        className="npbar__extra"
        onClick={() => setQueueOpen(true)}
        data-testid="npbar-queue"
        aria-label="Queue"
      >
        <IonIcon icon={listOutline} />
      </button>
      <button
        className="npbar__extra"
        onClick={toggleMute}
        data-testid="npbar-mute"
        aria-label={muted ? 'Unmute' : 'Mute'}
      >
        <IonIcon icon={muted ? volumeMute : volumeHigh} />
      </button>
      <input
        className="npbar__volume"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => setVolume(Number(e.target.value))}
        aria-label="Volume"
        aria-valuetext={`${Math.round(volume * 100)}%`}
        data-testid="npbar-volume"
      />
      <QueueView open={queueOpen} onClose={() => setQueueOpen(false)} />
      <LyricsSheet open={lyricsOpen} onClose={() => setLyricsOpen(false)} />
    </div>
  );
}
