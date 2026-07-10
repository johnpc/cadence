import { useCallback, type RefObject } from 'react';
import * as q from './queue';
import type { usePlayerQueue } from './usePlayerQueue';

type QueueHook = ReturnType<typeof usePlayerQueue>;

/** Refs the ended-handler reads to honour an "end of track" sleep timer without
 * depending on hook declaration order in PlayerProvider: `active` is true while
 * that mode is armed, `onReached` pauses + disarms when the current track ends. */
export interface SleepAtTrackEnd {
  active: RefObject<boolean>;
  onReached: RefObject<() => void>;
}

/** The audio element's `ended` and `error` handlers, kept out of PlayerProvider
 * for the line gate.
 * - ended: if an "end of track" sleep timer is armed, pause + disarm; otherwise
 *   apply the repeat rule ('one' restarts the same element).
 * - error: a track that fails to load (bad transcode / 404) shouldn't stall
 *   playback — tell the user, then skip to the next (only when there IS a next;
 *   at the queue end just report it), like Spotify. */
export function usePlaybackHandlers(
  qh: QueueHook,
  audioRef: RefObject<HTMLAudioElement | null>,
  toast: (message: string) => void,
  sleep?: SleepAtTrackEnd,
) {
  const onEnded = useCallback(() => {
    // "Stop after this track" sleep timer: a NATURAL end (not a manual skip)
    // pauses playback and disarms, instead of advancing the queue.
    if (sleep?.active.current) {
      sleep.onReached.current?.();
      return;
    }
    // Reached the end with nothing to follow (repeat off + no next; if Autoplay
    // were on, endless-play radio would already have appended by now) — playback
    // is about to stop, so say so rather than leaving it looking frozen.
    if (qh.repeat === 'off' && !q.hasNext(qh.queue)) {
      toast("You've reached the end of the queue.");
    }
    qh.advance(() => {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        void audio.play().catch(() => undefined);
      }
    });
  }, [qh, audioRef, sleep, toast]);

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
