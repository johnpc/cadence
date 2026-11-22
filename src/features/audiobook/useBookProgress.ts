import { useMemo } from 'react';
import { usePlayer } from '../player/usePlayer';
import { usePlayerProgress } from '../player/PlayerProgressContext';
import { setPendingSeek } from '../player/pendingSeek';
import { useChapters } from './useChapters';
import { isAudiobook } from './isAudiobook';
import { bookParts, bookPosition, partAt, partDurations, type BookPosition } from './bookPosition';

/**
 * The playing audiobook's place in the book and in the chapter, plus one seek
 * command in GLOBAL book seconds: a target in the playing part seeks it; a target
 * in another queued part of the book jumps there and resumes at the right spot.
 * `model` is null when the current track isn't an audiobook.
 */
export function useBookProgress(): {
  model: BookPosition | null;
  rate: number;
  seekBook: (globalSeconds: number) => void;
} {
  const p = usePlayer();
  const { position, duration } = usePlayerProgress();
  const { chapters } = useChapters(p.current);
  const current = isAudiobook(p.current) ? p.current : null;
  const parts = useMemo(() => (current ? bookParts(current, p.queue) : []), [current, p.queue]);
  const model = current
    ? bookPosition({ current, parts, position, duration, chapters, rate: p.rate })
    : null;
  const seekBook = (globalSeconds: number) => {
    if (!current) return;
    const target = partAt(parts, partDurations(parts, current.Id, duration), globalSeconds);
    if (!target) return;
    if (target.itemId === current.Id) return p.seek(target.seconds);
    const queueIndex = p.queue.findIndex((t) => t.Id === target.itemId);
    if (queueIndex < 0) return;
    setPendingSeek(target.itemId, target.seconds);
    p.jumpTo(queueIndex);
  };
  return { model, rate: p.rate, seekBook };
}
