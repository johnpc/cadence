import type { ReadAlongState } from './readAlongState';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { ReadAlongChapter, ReadAlongClip } from './storytellerApi';

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
}) {
  const book = input.state.kind === 'ready' ? input.state.book : null;
  return {
    title: book?.Title ?? input.current?.Album ?? input.current?.Name ?? '',
    chapterTitle: chapterLine(
      input.playheadChapter,
      input.chapter?.Title ?? null,
      input.chapterRemaining,
    ),
    activeFragment: input.clip?.Fragment ?? null,
    isLoading: input.state.kind === 'loading' || input.textLoading,
    isError: input.state.kind === 'error' || input.textError,
  };
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
