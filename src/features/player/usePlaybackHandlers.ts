import { useCallback, type RefObject } from 'react';
import type { usePlayerQueue } from './usePlayerQueue';

type QueueHook = ReturnType<typeof usePlayerQueue>;

/** The audio element's `ended` and `error` handlers, kept out of PlayerProvider
 * for the line gate.
 * - ended: apply the repeat rule ('one' restarts the same element).
 * - error: a track that fails to load (bad transcode / 404) shouldn't stall
 *   playback — tell the user, then skip to the next (a no-op at the queue end),
 *   like Spotify. */
export function usePlaybackHandlers(
  qh: QueueHook,
  audioRef: RefObject<HTMLAudioElement | null>,
  toast: (message: string) => void,
) {
  const onEnded = useCallback(() => {
    qh.advance(() => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        void audio.play().catch(() => undefined);
      }
    });
  }, [qh, audioRef]);

  const onError = useCallback(() => {
    toast("Couldn't play that track — skipping.");
    qh.next();
  }, [qh, toast]);

  return { onEnded, onError };
}
