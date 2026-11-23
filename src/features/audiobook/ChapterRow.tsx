import { forwardRef } from 'react';
import { formatTime } from '../player/playerFormat';
import type { AudiobookChapter } from './audiobookTypes';

/** One chapter in the chapter list: title + timestamp, tappable to seek. The
 * active chapter (the one currently playing) is marked with the accent colour. */
export const ChapterRow = forwardRef<
  HTMLButtonElement,
  { chapter: AudiobookChapter; index: number; active: boolean; onSeek: (seconds: number) => void }
>(function ChapterRow({ chapter, index, active, onSeek }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      className={active ? 'chapter-row chapter-row--active' : 'chapter-row'}
      data-testid="chapter-row"
      aria-current={active ? 'true' : undefined}
      onClick={() => onSeek(chapter.start)}
    >
      <span className="chapter-row__num cad-meta">{index + 1}</span>
      <span className="chapter-row__name">{chapter.name}</span>
      <span className="chapter-row__time cad-meta">{formatTime(chapter.start)}</span>
    </button>
  );
});
