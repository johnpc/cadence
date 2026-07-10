import { useCallback, type RefObject } from 'react';

/**
 * Transport actions bound to the audio element: toggle (play/pause), seek, and
 * an explicit pause. Extracted from PlayerProvider to keep it thin.
 */
export function usePlaybackControls(ref: RefObject<HTMLAudioElement | null>, hasQueue: boolean) {
  const toggle = useCallback(() => {
    const audio = ref.current;
    if (!audio || !hasQueue) return;
    if (audio.paused) void audio.play().catch(() => undefined);
    else audio.pause();
  }, [ref, hasQueue]);

  const seek = useCallback(
    (seconds: number) => {
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

  return { toggle, seek, seekBy, pause };
}
