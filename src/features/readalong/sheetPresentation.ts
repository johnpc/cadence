import { formatTime } from '../player/playerFormat';
import type { ReadAlongState } from './readAlongState';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { ReadAlongBook, ReadAlongChapter, ReadAlongClip } from './storytellerApi';

/** The sheet's header + load flags, folded from the state union, the chapter in
 * view and the text query. Pure, so the hook stays a thin wiring layer. */
export function sheetPresentation(input: {
  state: ReadAlongState;
  current: JellyfinItem | null;
  chapter: ReadAlongChapter | null;
  clip: ReadAlongClip | null;
  textLoading: boolean;
  textError: boolean;
  /** The audiobook's own chapter at the playhead (from the m4b markers), if any. */
  playheadChapter: string | null;
  /** "12m left" in that chapter, if known. */
  chapterRemaining: string | null;
  /** The next sentence and the wait until it, during a silent stretch. */
  upcoming: { clip: ReadAlongClip; secondsUntil: number } | null;
}) {
  const book = input.state.kind === 'ready' ? input.state.book : null;
  return {
    title: bookTitle(book, input.current),
    chapterTitle: headerLine(input),
    activeFragment: input.clip?.Fragment ?? null,
    upcomingFragment: input.upcoming?.clip.Fragment ?? null,
    isLoading: input.state.kind === 'loading' || input.textLoading,
    isError: input.state.kind === 'error' || input.textError,
  };
}

/** Storyteller's title, else the album, else the track name. */
function bookTitle(book: ReadAlongBook | null, current: JellyfinItem | null): string {
  return book?.Title ?? current?.Album ?? current?.Name ?? '';
}

/** During a silent stretch the second line counts down to the next sentence;
 * otherwise it says where the listener is (chapterLine). */
function headerLine(input: {
  chapter: ReadAlongChapter | null;
  playheadChapter: string | null;
  chapterRemaining: string | null;
  upcoming: { clip: ReadAlongClip; secondsUntil: number } | null;
}): string | null {
  if (input.upcoming) return `Narration starts in ${formatTime(input.upcoming.secondsUntil)}`;
  return chapterLine(input.playheadChapter, input.chapter?.Title ?? null, input.chapterRemaining);
}

/**
 * The header's second line — where the listener IS: the audiobook's own chapter
 * name with the time left in it ("Chapter 3 · 12m left"), falling back to the
 * Storyteller chapter title, or nothing when neither is known.
 */
export function chapterLine(
  playheadChapter: string | null,
  readaloudTitle: string | null,
  chapterRemaining: string | null,
): string | null {
  const name = playheadChapter ?? readaloudTitle;
  if (!name) return null;
  return playheadChapter && chapterRemaining ? `${name} · ${chapterRemaining}` : name;
}
