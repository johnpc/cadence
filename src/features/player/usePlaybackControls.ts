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

  const pause = useCallback(() => ref.current?.pause(), [ref]);

  return { toggle, seek, pause };
}
