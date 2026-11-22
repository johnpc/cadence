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
}) {
  const book = input.state.kind === 'ready' ? input.state.book : null;
  return {
    title: book?.Title ?? input.current?.Album ?? input.current?.Name ?? '',
    chapterTitle: input.chapter?.Title ?? null,
    activeFragment: input.clip?.Fragment ?? null,
    isLoading: input.state.kind === 'loading' || input.textLoading,
    isError: input.state.kind === 'error' || input.textError,
  };
}
