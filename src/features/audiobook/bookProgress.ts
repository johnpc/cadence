import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const TICKS_PER_SECOND = 10_000_000;

export interface BookProgress {
  /** 0..1 across the WHOLE book (all parts). */
  fraction: number;
  /** Seconds listened so far, summed across parts. */
  listenedSeconds: number;
  /** Seconds remaining in the book. */
  remainingSeconds: number;
  /** True once every part is marked played (finished the book). */
  completed: boolean;
  /** True once any real listening has happened (so we can hide 0% state). */
  started: boolean;
}

/** Seconds listened in one part: its full runtime if played, else the saved
 * resume position. */
function partListened(p: JellyfinItem): number {
  const runtime = (p.RunTimeTicks ?? 0) / TICKS_PER_SECOND;
  if (p.UserData?.Played) return runtime;
  return (p.UserData?.PlaybackPositionTicks ?? 0) / TICKS_PER_SECOND;
}

/**
 * Reading progress for a whole book, summed across its parts (a single-file book
 * is just one part). Pure so it's unit-testable; the row/player feed it a Book.
 * When runtimes are unknown (RunTimeTicks absent) the fraction falls back to the
 * share of parts marked played, so a finished book still reads as complete.
 */
export function bookProgress(book: Book): BookProgress {
  const total = book.parts.reduce((s, p) => s + (p.RunTimeTicks ?? 0) / TICKS_PER_SECOND, 0);
  const listenedSeconds = book.parts.reduce((s, p) => s + partListened(p), 0);
  const completed = book.parts.length > 0 && book.parts.every((p) => p.UserData?.Played);
  const started = completed || listenedSeconds > 1;
  const fraction = completed
    ? 1
    : total > 0
      ? Math.min(1, listenedSeconds / total)
      : book.parts.filter((p) => p.UserData?.Played).length / Math.max(1, book.parts.length);
  return {
    fraction,
    listenedSeconds,
    remainingSeconds: Math.max(0, total - listenedSeconds),
    completed,
    started,
  };
}
