import type { AudiobookChapter } from './audiobookTypes';

/**
 * Pure chapter lookup over a sorted-by-`start` chapter list. Kept free of
 * React/audio so it's trivially unit-testable — the player just feeds it the
 * current position in seconds.
 */

/** Index of the chapter containing `position` (the last chapter whose start is
 * ≤ position), or -1 when there are no chapters / position precedes the first. */
export function chapterIndexAt(chapters: AudiobookChapter[], position: number): number {
  let idx = -1;
  for (let i = 0; i < chapters.length; i++) {
    if (chapters[i].start <= position) {
      idx = i;
    } else {
      break;
    }
  }
  return idx;
}
