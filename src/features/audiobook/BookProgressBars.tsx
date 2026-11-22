import { ProgressRow } from './ProgressRow';
import type { BookPosition } from './bookPosition';

/**
 * The audiobook's two progress bars: the CHAPTER (primary — what you scrub to
 * re-hear a line) and the whole BOOK beneath it, each labelled with which chapter
 * / which book it is. A book without chapters shows only the book bar. Seeks are
 * global book seconds, so the chapter bar offsets by the chapter's start.
 * `testPrefix` keeps the player's and the read-along sheet's bars distinct.
 */
export function BookProgressBars({
  model,
  rate,
  testPrefix = '',
  onSeekBook,
  onAct,
}: {
  model: BookPosition;
  rate: number;
  testPrefix?: string;
  onSeekBook: (globalSeconds: number) => void;
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
          showRemaining={false}
          size="primary"
          onSeek={(s) => seek(chapter.start + s)}
        />
      )}
      <ProgressRow
        testId={`${testPrefix}book-progress`}
        label={book.title}
        position={book.position}
        duration={book.duration}
        rate={rate}
        showRemaining
        size={chapter ? 'secondary' : 'primary'}
        onSeek={seek}
      />
    </div>
  );
}
