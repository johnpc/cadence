import { chapterIndexAt } from '../audiobook/chapterAt';
import type { AudiobookChapter } from '../audiobook/audiobookTypes';

/** Within this many seconds of a chapter's start, "previous" means the chapter
 * before it; later than that it restarts the current chapter — the convention
 * every audiobook player and CD deck shares. */
export const RESTART_GRACE_SECONDS = 3;

/**
 * Where "previous chapter" / "next chapter" should seek from `position`, or
 * null when there is no such target (no chapters, or already in the last one).
 * Pure; the transport just seeks to the answer.
 */
export function adjacentChapter(
  chapters: AudiobookChapter[],
  position: number,
  direction: 'previous' | 'next',
): number | null {
  if (chapters.length === 0) return null;
  const idx = chapterIndexAt(chapters, position);
  if (direction === 'next') {
    const next = chapters[idx + 1];
    return next ? next.start : null;
  }
  if (idx < 0) return null;
  const current = chapters[idx];
  if (position - current.start > RESTART_GRACE_SECONDS) return current.start;
  return idx > 0 ? chapters[idx - 1].start : current.start;
}
