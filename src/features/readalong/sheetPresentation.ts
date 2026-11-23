import { formatTime } from '../player/playerFormat';
import { displayTitle } from '../audiobook/bookTitle';
import type { ReadAlongState } from './readAlongState';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { ReadAlongBook, ReadAlongChapter, ReadAlongClip } from './storytellerApi';

/**
 * The sheet's header + load flags, folded from the state union, the chapter in
 * view and the text query. Pure, so the hook stays a thin wiring layer.
 *
 * The header says WHAT you're reading — the book and its author. Where you are
 * (the chapter) belongs to the chapter bar at the bottom, so it isn't repeated
 * up here. During a silent stretch the author line gives way to "Narration
 * starts in 0:42", the one thing worth knowing at that moment.
 */
export function sheetPresentation(input: {
  state: ReadAlongState;
  current: JellyfinItem | null;
  chapter: ReadAlongChapter | null;
  clip: ReadAlongClip | null;
  textLoading: boolean;
  textError: boolean;
  upcoming: { clip: ReadAlongClip; secondsUntil: number } | null;
}) {
  const book = input.state.kind === 'ready' ? input.state.book : null;
  return {
    title: headerTitle(book, input.current),
    subtitle: input.upcoming
      ? `Narration starts in ${formatTime(input.upcoming.secondsUntil)}`
      : author(input.current),
    activeFragment: input.clip?.Fragment ?? null,
    upcomingFragment: input.upcoming?.clip.Fragment ?? null,
    isLoading: input.state.kind === 'loading' || input.textLoading,
    isError: input.state.kind === 'error' || input.textError,
  };
}

function headerTitle(book: ReadAlongBook | null, current: JellyfinItem | null): string {
  const raw = book?.Title ?? current?.Album ?? current?.Name ?? '';
  return raw ? displayTitle(raw) : '';
}

/** The book's author as Jellyfin knows it: the album artist, else the first artist. */
export function author(current: JellyfinItem | null): string | null {
  return current?.AlbumArtist ?? current?.Artists?.[0] ?? null;
}
