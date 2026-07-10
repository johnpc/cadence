import { useCallback, type RefObject } from 'react';
import * as q from './queue';
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
    // Only react to errors during ACTUAL playback. On cold launch the restored
    // track's src is set while paused (and before the auth token may have
    // hydrated), which can fire a spurious `error` — surfacing a scary toast and
    // skipping a track the user never tried to play. If we're paused, ignore it;
    // the next real play attempt will re-load a valid src.
    const audio = audioRef.current;
    if (audio && audio.paused) return;
    // If there's somewhere to advance, skip past the bad track; otherwise it's
    // the last one — say so, rather than a "skipping" toast that goes nowhere
    // and leaves playback looking frozen on a track that never plays.
    if (q.hasNext(qh.queue) || (qh.repeat === 'all' && qh.queue.tracks.length > 1)) {
      toast("Couldn't play that track — skipping.");
      qh.next();
    } else {
      toast("Couldn't play that track.");
    }
  }, [qh, audioRef, toast]);

  return { onEnded, onError };
}
