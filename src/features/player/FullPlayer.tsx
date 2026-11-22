import { IonModal, IonIcon } from '@ionic/react';
import { chevronDown } from 'ionicons/icons';
import { useOverlay } from '../../lib/useOverlay';
import { AmbientBackground } from './AmbientBackground';
import { QueueView } from './QueueView';
import { LyricsSheet } from './LyricsSheet';
import { ChapterSheet } from '../audiobook/ChapterSheet';
import { LazyReadAlongSheet } from '../readalong/LazyReadAlongSheet';
import { AudiobookSeekButtons } from '../audiobook/AudiobookSeekButtons';
import { AudiobookScrubbers } from '../audiobook/AudiobookScrubbers';
import { isAudiobook } from '../audiobook/isAudiobook';
import { SpeedSlider } from '../audiobook/SpeedSlider';
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
  const sheet = useOverlay<'queue' | 'lyrics' | 'chapters' | 'readalong'>();
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
          {isAudiobook(p.current) ? (
            <AudiobookScrubbers />
          ) : (
            <>
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
            </>
          )}
        </div>
        <AudiobookSeekButtons />
        <PlayerControls />
        <SpeedSlider />
        <VolumeSlider volume={p.volume} setVolume={p.setVolume} />
        <FullPlayerFooter
          current={p.current}
          onOpenLyrics={() => sheet.show('lyrics')}
          onOpenChapters={() => sheet.show('chapters')}
          onOpenReadAlong={() => sheet.show('readalong')}
          onOpenQueue={() => sheet.show('queue')}
          onClose={onClose}
        />
        <NextUpHint onOpenQueue={() => sheet.show('queue')} />
        <QueueView open={sheet.open === 'queue'} onClose={() => sheet.closed('queue')} />
        <LyricsSheet open={sheet.open === 'lyrics'} onClose={() => sheet.closed('lyrics')} />
        <ChapterSheet open={sheet.open === 'chapters'} onClose={() => sheet.closed('chapters')} />
        <LazyReadAlongSheet
          open={sheet.open === 'readalong'}
          onClose={() => sheet.closed('readalong')}
        />
      </div>
    </IonModal>
  );
}
