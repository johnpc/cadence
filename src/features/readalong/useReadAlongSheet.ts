import { useEffect, useMemo, useState } from 'react';
import { usePlayer } from '../player/usePlayer';
import { usePlayerProgress } from '../player/PlayerProgressContext';
import { setPendingSeek } from '../player/pendingSeek';
import { isAudiobook } from '../audiobook/isAudiobook';
import { storytellerEnabled } from '../../lib/runtimeConfig';
import { useChapterText, useReadAlongBook } from './useReadAlong';
import { deriveReadAlongState, type FollowMode } from './readAlongState';
import { chapterInView } from './chapterInView';
import { planSeek, type SeekPlan } from './seekPlan';
import { sanitizeChapter } from './sanitizeChapter';
import { chapterResourceUrl } from './storytellerApi';
import { sheetPresentation } from './sheetPresentation';
import type { PlayerContextValue } from '../player/types';

/** Follow mode: every open starts by following the narration. */
function useFollowMode(open: boolean) {
  const [follow, setFollow] = useState<FollowMode>('following');
  useEffect(() => {
    if (open) setFollow('following');
  }, [open]);
  return { follow, setFollow };
}

/** Carry out a seek plan on the player. */
function applySeekPlan(plan: SeekPlan, p: PlayerContextValue): void {
  if (plan.kind === 'seek') p.seek(plan.seconds);
  if (plan.kind === 'jump') {
    setPendingSeek(plan.itemId, plan.seconds);
    p.jumpTo(plan.queueIndex);
  }
}

/** Everything the read-along sheet renders, derived in one place: the state
 * union, the chapter in view, its sanitized html, the sentence being narrated,
 * the follow mode, and the tap-to-seek command. */
export function useReadAlongSheet(open: boolean) {
  const p = usePlayer();
  const { position } = usePlayerProgress();
  const current = p.current;
  const currentId = current?.Id;
  const enabled = storytellerEnabled();
  const bookQ = useReadAlongBook(currentId, open && enabled && isAudiobook(current));
  const state = deriveReadAlongState({
    enabled,
    isAudiobook: isAudiobook(current),
    isLoading: bookQ.isLoading,
    isError: bookQ.isError,
    book: bookQ.book,
  });
  const book = state.kind === 'ready' ? state.book : null;
  const view = chapterInView(book, currentId, position);
  const textQ = useChapterText(currentId, view.chapter?.Href ?? null);
  const href = view.chapter?.Href;
  const html = useMemo(
    () =>
      textQ.html && href && currentId
        ? sanitizeChapter(textQ.html, href, (path) => chapterResourceUrl(currentId, path, true))
        : '',
    [textQ.html, href, currentId],
  );
  const { follow, setFollow } = useFollowMode(open);

  const onTapFragment = (fragment: string) => {
    if (!book || !currentId) return;
    const queueIds = p.queue.map((t) => t.Id);
    const plan = planSeek({
      book,
      chapter: view.chapterIndex,
      fragment,
      currentItemId: currentId,
      queueIds,
    });
    applySeekPlan(plan, p);
    setFollow('following');
  };

  const retry = () => void (state.kind === 'error' ? bookQ.refetch() : textQ.refetch());
  return {
    state,
    html,
    follow,
    setFollow,
    onTapFragment,
    retry,
    ...sheetPresentation({
      state,
      current,
      chapter: view.chapter,
      clip: view.clip,
      textLoading: textQ.isLoading,
      textError: textQ.isError,
    }),
  };
}
