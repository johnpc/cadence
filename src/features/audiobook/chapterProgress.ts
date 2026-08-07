import { chapterIndexAt } from './chapterAt';
import type { AudiobookChapter } from './audiobookTypes';

/** A human "time remaining" phrase like "7h 12m left" / "15m left" / "45s left".
 * Rounds to whole minutes above a minute; shows seconds only under a minute. */
export function formatRemaining(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s left`;
  const totalMin = Math.round(s / 60);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m left`;
  return `${m}m left`;
}

/**
 * The two audiobook "time left" readouts for a position: remaining in the current
 * CHAPTER (bounded by the next chapter's start, or the book end for the last
 * chapter) and remaining in the whole BOOK. `rate` is the playback speed — the
 * wall-clock time left is the media-seconds left divided by the speed, so at 2×
 * a 60-minute book shows "30m left". Returns null for chapter when there are no
 * chapters. Pure so it's unit-testable.
 */
export function remaining(
  chapters: AudiobookChapter[],
  position: number,
  duration: number,
  rate = 1,
): { chapter: string | null; book: string } {
  const speed = rate > 0 ? rate : 1;
  const book = formatRemaining((duration - position) / speed);
  const idx = chapterIndexAt(chapters, position);
  if (idx < 0 || chapters.length === 0) {
    return { chapter: null, book };
  }
  const next = chapters[idx + 1];
  const chapterEnd = next ? next.start : duration;
  return { chapter: formatRemaining((chapterEnd - position) / speed), book };
}
