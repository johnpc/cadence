import { useCallback, type RefObject } from 'react';
import { tap } from '../../lib/haptics';
import { getCastState } from '../cast/castStore';
import { castToggle, castSeek } from '../cast/castController';
import { log } from '../../lib/diagnostics/diagnosticsStore';

/**
 * Transport actions bound to the audio element: toggle (play/pause), seek, and
 * an explicit pause. Extracted from PlayerProvider to keep it thin. When casting
 * to a TV, toggle/seek proxy to the receiver instead of the local element.
 */
export function usePlaybackControls(
  ref: RefObject<HTMLAudioElement | null>,
  hasQueue: boolean,
  isPlaying: boolean,
) {
  const toggle = useCallback(() => {
    if (!hasQueue) return;
    tap();
    if (getCastState().connected) {
      void castToggle().catch(() => undefined);
      return;
    }
    const audio = ref.current;
    if (!audio) return;
    // Decide from isPlaying (what the button SHOWS), not audio.paused. On iOS a
    // background/interruption leaves audio.paused === false with no 'pause' event,
    // so the two disagree — deciding on audio.paused made the tap do the opposite
    // of the button (needing two taps to "take"). Acting on the shown state keeps
    // one tap = the transition the user expects.
    log('toggle', 'user toggle', { wasPlaying: String(isPlaying), paused: String(audio.paused) });
    if (isPlaying) {
      audio.pause();
    } else {
      void audio.play().catch((e: unknown) => {
        log('play-rejected', 'toggle play() rejected', {
          reason: e instanceof Error ? e.name : 'unknown',
        });
      });
    }
  }, [ref, hasQueue, isPlaying]);

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

  const pause = useCallback(() => ref.current?.pause(), [ref]);

  // Recover from an OS audio interruption (Siri, a phone call). iOS stops output
  // at the AUDIO-SESSION level, not the element level, so `audio.paused` often
  // stays FALSE and no 'pause' event fires — the UI still shows "playing" but no
  // sound comes out. So we DON'T guard on `.paused` (that check would no-op the
  // exact broken state); we just call play() unconditionally, which is a safe
  // no-op if genuinely playing and re-establishes output otherwise. Skipped only
  // when there's no queue or we're casting (the TV owns playback then).
  const resume = useCallback(() => {
    if (!hasQueue || getCastState().connected) return;
    void ref.current?.play().catch(() => undefined);
  }, [ref, hasQueue]);

  return { toggle, seek, seekBy, pause, resume };
}
