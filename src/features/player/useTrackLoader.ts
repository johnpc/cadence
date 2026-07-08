import { useEffect, useRef, type RefObject } from 'react';
import { audioStreamUrl } from '../../lib/jellyfinStream';

/**
 * Points the audio element at the current track and plays on change. A track
 * restored from a previous session (present at first mount) is loaded but left
 * paused — like Spotify, and browsers block autoplay anyway.
 */
export function useTrackLoader(ref: RefObject<HTMLAudioElement | null>, currentId?: string): void {
  const skipAutoPlay = useRef(!!currentId);
  useEffect(() => {
    const audio = ref.current;
    if (!audio || !currentId) return;
    audio.src = audioStreamUrl(currentId);
    if (skipAutoPlay.current) {
      skipAutoPlay.current = false;
      return;
    }
    void audio.play().catch(() => undefined);
  }, [currentId, ref]);
}
