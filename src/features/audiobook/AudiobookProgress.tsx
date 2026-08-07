import { usePlayer } from '../player/usePlayer';
import { usePlayerProgress } from '../player/PlayerProgressContext';
import { useChapters } from './useChapters';
import { chapterIndexAt } from './chapterAt';
import { remaining } from './chapterProgress';
import { isAudiobook } from './isAudiobook';
import './audiobookProgress.css';

/** Under-scrubber readout for an audiobook: the current chapter name plus time
 * left in the chapter and in the whole book (e.g. "Chapter 3 · 15m left" /
 * "7h 12m left in book"). Renders nothing for music or before chapters load. */
export function AudiobookProgress() {
  const { current, rate } = usePlayer();
  const { position, duration } = usePlayerProgress();
  const { chapters } = useChapters(current);
  if (!isAudiobook(current)) return null;

  const idx = chapterIndexAt(chapters, position);
  const chapterName = idx >= 0 ? chapters[idx].name : null;
  const { chapter, book } = remaining(chapters, position, duration, rate);

  return (
    <div className="ab-progress cad-meta" data-testid="audiobook-progress">
      {chapterName && (
        <span className="ab-progress__chapter" data-testid="audiobook-chapter-line">
          {chapterName}
          {chapter && <> · {chapter}</>}
        </span>
      )}
      <span className="ab-progress__book" data-testid="audiobook-book-line">
        {book} in book
      </span>
    </div>
  );
}
