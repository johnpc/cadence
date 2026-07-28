import { useEffect, type RefObject } from 'react';
import { resumeSeconds } from './resumePosition';
import { log } from '../../lib/diagnostics/diagnosticsStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Silently resume an audiobook where the listener left off. When the current
 * track is an audiobook with a saved server position, seek to it once the audio
 * element reports a usable duration (loadedmetadata) — but only ONCE per track,
 * and only if playback is still at the very start (so we never yank a listener
 * who has already scrubbed). Music is untouched (resumeSeconds returns null).
 */
export function useAudiobookResume(
  ref: RefObject<HTMLAudioElement | null>,
  current: JellyfinItem | null | undefined,
): void {
  const id = current?.Id;
  useEffect(() => {
    const audio = ref.current;
    if (!audio || !current) return;
    let done = false;

    const tryResume = () => {
      if (done) return;
      const target = resumeSeconds(current, audio.duration || 0);
      if (target === null) {
        done = true;
        return;
      }
      // Only seek from the start — respect a listener who already moved.
      if (audio.currentTime <= 1) {
        audio.currentTime = target;
        log('audiobook', 'resumed', { id: id ?? '', seconds: String(Math.round(target)) });
      }
      done = true;
    };

    if (audio.readyState >= 1) tryResume(); // metadata already available
    audio.addEventListener('loadedmetadata', tryResume);
    return () => audio.removeEventListener('loadedmetadata', tryResume);
  }, [ref, current, id]);
}
