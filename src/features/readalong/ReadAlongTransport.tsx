import { IonIcon } from '@ionic/react';
import { pause, play, playBack, playForward, playSkipBack, playSkipForward } from 'ionicons/icons';
import { formatTime } from '../player/playerFormat';
import type { AudiobookChapter } from '../audiobook/audiobookTypes';
import { adjacentChapter } from './adjacentChapter';

/** Skip amount in seconds — the audiobook convention, same as the player. */
const SKIP = 30;

/**
 * The sheet's own transport, so reading along never means leaving the text to
 * pause or move: previous chapter · back 30 s · play/pause · forward 30 s · next
 * chapter, with the time beneath. Chapter buttons exist only when the file has
 * chapter markers. Every action hands the follow mode back to the narration
 * (`onAct`). Render-only; the seek targets come from pure helpers.
 */
export function ReadAlongTransport({
  isPlaying,
  position,
  duration,
  chapters,
  onToggle,
  onSeek,
  onAct,
}: {
  isPlaying: boolean;
  position: number;
  duration: number;
  chapters: AudiobookChapter[];
  onToggle: () => void;
  onSeek: (seconds: number) => void;
  onAct: () => void;
}) {
  const act = (fn: () => void) => () => {
    fn();
    onAct();
  };
  const seekTo = (target: number | null) => {
    if (target !== null) onSeek(target);
  };
  const hasChapters = chapters.length > 0;
  return (
    <div className="readalong__transport" data-testid="readalong-transport">
      <div className="readalong__transport-row">
        {hasChapters && (
          <button
            className="readalong__tbtn"
            onClick={act(() => seekTo(adjacentChapter(chapters, position, 'previous')))}
            aria-label="Previous chapter"
            data-testid="readalong-prev-chapter"
          >
            <IonIcon icon={playSkipBack} />
          </button>
        )}
        <button
          className="readalong__tbtn"
          onClick={act(() => onSeek(Math.max(0, position - SKIP)))}
          aria-label="Back 30 seconds"
          data-testid="readalong-back"
        >
          <IonIcon icon={playBack} />
          <span className="readalong__tlabel">30</span>
        </button>
        <button
          className="readalong__tbtn readalong__tbtn--play"
          onClick={act(onToggle)}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          data-testid="readalong-toggle"
        >
          <IonIcon icon={isPlaying ? pause : play} />
        </button>
        <button
          className="readalong__tbtn"
          onClick={act(() => onSeek(Math.min(duration || position + SKIP, position + SKIP)))}
          aria-label="Forward 30 seconds"
          data-testid="readalong-forward"
        >
          <span className="readalong__tlabel">30</span>
          <IonIcon icon={playForward} />
        </button>
        {hasChapters && (
          <button
            className="readalong__tbtn"
            onClick={act(() => seekTo(adjacentChapter(chapters, position, 'next')))}
            aria-label="Next chapter"
            data-testid="readalong-next-chapter"
          >
            <IonIcon icon={playSkipForward} />
          </button>
        )}
      </div>
      <p className="readalong__time cad-meta" data-testid="readalong-time">
        {formatTime(position)} / {formatTime(duration)}
      </p>
    </div>
  );
}
