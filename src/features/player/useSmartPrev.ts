import { useCallback, type RefObject } from 'react';
import { prevAction } from './prevAction';

/** "Previous" that restarts the current track when we're more than a few seconds
 * in, else goes to the prior track (Spotify/desktop convention). Reads the live
 * position off the element so there's no stale-closure risk. While casting, the
 * receiver owns position (the local element sits at 0), so it falls through to
 * the queue's prev — matching the TV remote. */
export function useSmartPrev(
  ref: RefObject<HTMLAudioElement | null>,
  seek: (seconds: number) => void,
  queuePrev: () => void,
): () => void {
  return useCallback(() => {
    const pos = ref.current?.currentTime ?? 0;
    if (prevAction(pos) === 'restart') seek(0);
    else queuePrev();
  }, [ref, seek, queuePrev]);
}
