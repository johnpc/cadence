import { useCallback, type RefObject } from 'react';
import { tap } from '../../lib/haptics';
import { getCastState } from '../cast/castStore';
import { castSeek, stopCast } from '../cast/castController';
import { setPlayIntent } from './playIntentStore';
import { playAudio, pauseAudio } from './playbackActions';
import { log } from '../../lib/diagnostics/diagnosticsStore';

/** Stop + unsource the element (nothing left buffered/backgrounded) and end any
 * TV cast. Module-level so it adds no branches to the hook's CRAP. */
function tearDownSession(audio: HTMLAudioElement | null): void {
  setPlayIntent(false); // deliberate stop — never auto-resume after this
  if (getCastState().connected) void stopCast().catch(() => undefined);
  if (!audio) return;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
}

/**
 * Transport actions bound to the audio element: toggle (play/pause), seek, and
 * an explicit pause. Extracted from PlayerProvider to keep it thin. When casting
 * to a TV, toggle/seek proxy to the receiver instead of the local element.
 */
export function usePlaybackControls(
  ref: RefObject<HTMLAudioElement | null>,
  hasQueue: boolean,
  isPlaying: boolean,
  /** Empties the play queue — composed into `stop` so callers get full session
   * teardown (audio + queue) in one action. */
  emptyQueue: () => void,
) {
  const toggle = useCallback(() => {
    if (!hasQueue) return;
    tap();
    const audio = ref.current;
    // Decide from isPlaying (what the button SHOWS), not audio.paused. On iOS a
    // background/interruption leaves audio.paused === false with no 'pause' event,
    // so the two disagree — deciding on audio.paused made the tap do the opposite
    // of the button (needing two taps to "take"). Acting on the shown state keeps
    // one tap = the transition the user expects. The directional play/pause helpers
    // keep play-intent (and casting) correct.
    log('toggle', 'user toggle', { wasPlaying: String(isPlaying), paused: String(audio?.paused) });
    if (isPlaying) pauseAudio(audio);
    else playAudio(audio);
  }, [ref, hasQueue, isPlaying]);

  // The OS lock-screen / Bluetooth transport gives an EXPLICIT direction — bind
  // these (not toggle) so an iOS state desync after an interruption can't make the
  // "play" button run the pause branch (the "first lock-screen play does nothing"
  // bug). No-op with no queue.
  const play = useCallback(() => {
    if (hasQueue) playAudio(ref.current);
  }, [ref, hasQueue]);

  const seek = useCallback(
    (seconds: number) => {
      if (getCastState().connected) {
        void castSeek(seconds).catch(() => undefined);
        return;
      }
      if (ref.current) ref.current.currentTime = seconds;
    },
    [ref],
  );

  // Relative seek (keyboard ±5s): read the live position off the element so
  // there's no stale-closure risk, and clamp to [0, duration].
  const seekBy = useCallback(
    (delta: number) => {
      const audio = ref.current;
      if (!audio) return;
      const max = Number.isFinite(audio.duration) ? audio.duration : audio.currentTime + delta;
      audio.currentTime = Math.max(0, Math.min(audio.currentTime + delta, max));
    },
    [ref],
  );

  const pause = useCallback(() => pauseAudio(ref.current), [ref]);

  // Mini-player close (X): tear down the element + cast, then empty the queue.
  const stop = useCallback(() => {
    tearDownSession(ref.current);
    emptyQueue();
  }, [ref, emptyQueue]);

  // Recover from an OS audio interruption (Siri, a phone call). iOS stops output
  // at the AUDIO-SESSION level, not the element, so `audio.paused` often stays
  // FALSE with no 'pause' event. So DON'T guard on `.paused` (that would no-op the
  // broken state) — call play() unconditionally (safe no-op if already playing).
  // Skipped with no queue or while casting: the TV owns playback then, and an
  // interruption on the phone must not toggle the receiver.
  const resume = useCallback(() => {
    if (!hasQueue || getCastState().connected) return;
    void ref.current?.play().catch(() => undefined);
  }, [ref, hasQueue]);

  return { toggle, play, seek, seekBy, pause, resume, stop };
}
