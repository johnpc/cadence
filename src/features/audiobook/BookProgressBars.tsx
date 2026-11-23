import type { ReactNode } from 'react';
import { ProgressRow, type RemainingPlacement } from './ProgressRow';
import type { BookPosition } from './bookPosition';
import type { PositionPhase } from '../player/engine/types';

/**
 * The audiobook's two progress bars: the CHAPTER (primary — what you scrub to
 * re-hear a line) and the whole BOOK beneath it. A book without chapters shows
 * only the book bar. Seeks are global book seconds, so the chapter bar offsets
 * by the chapter's start. Where it's shown decides the details:
 * - `bookLabel` overrides the book row's label (the full player says "Book" —
 *   the title is already its headline);
 * - `bookRemaining` puts the book's time left inline or on its own line;
 * - `onChapterLabel` makes the chapter name open the chapter list;
 * - `bookTrailing` ends the book row (the read-along sheet's speed pill).
 * `testPrefix` keeps the player's and the read-along sheet's bars distinct.
 */
export function BookProgressBars({
  model,
  rate,
  phase = 'known',
  testPrefix = '',
  bookLabel,
  bookRemaining = 'inline',
  bookTrailing,
  onSeekBook,
  onChapterLabel,
  onAct,
}: {
  model: BookPosition;
  rate: number;
  phase?: PositionPhase;
  testPrefix?: string;
  bookLabel?: string;
  bookRemaining?: Exclude<RemainingPlacement, 'none'>;
  bookTrailing?: ReactNode;
  onSeekBook: (globalSeconds: number) => void;
  onChapterLabel?: () => void;
  onAct?: () => void;
}) {
  const seek = (global: number) => {
    onSeekBook(global);
    onAct?.();
  };
  const { book, chapter } = model;
  return (
    <div className="book-progress" data-testid={`${testPrefix}book-progress-bars`}>
      {chapter && (
        <ProgressRow
          testId={`${testPrefix}chapter-progress`}
          label={chapter.title}
          position={chapter.position}
          duration={chapter.duration}
          rate={rate}
          remaining="none"
          size="primary"
          phase={phase}
          onSeek={(s) => seek(chapter.start + s)}
          onLabel={onChapterLabel}
        />
      )}
      <ProgressRow
        testId={`${testPrefix}book-progress`}
        label={bookLabel ?? book.title}
        position={book.position}
        duration={book.duration}
        rate={rate}
        remaining={bookRemaining}
        size={chapter ? 'secondary' : 'primary'}
        phase={phase}
        onSeek={seek}
        trailing={bookTrailing}
      />
    </div>
  );
}
