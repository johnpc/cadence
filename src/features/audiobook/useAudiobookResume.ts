import { useEffect, type RefObject } from 'react';
import { resumeSeconds } from './resumePosition';
import { takePendingSeek } from '../player/pendingSeek';
import { log } from '../../lib/diagnostics/diagnosticsStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Silently resume an audiobook where the listener left off. When the current
 * track is an audiobook with a saved server position, seek to it once the audio
 * element reports a usable duration (loadedmetadata) — but only ONCE per track,
 * and only if playback is still at the very start (so we never yank a listener
 * who has already scrubbed). Music is untouched (resumeSeconds returns null).
 *
 * A one-shot pending seek (a chapter tapped on the detail page before the track
 * loaded) takes priority over the saved position — the listener asked for that
 * exact spot, so honour it even if the book had a resume point.
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
      // An explicit chapter tap wins over the saved resume position.
      const pending = takePendingSeek(id);
      const target = pending ?? resumeSeconds(current, audio.duration || 0);
      if (target === null) {
        done = true;
        return;
      }
      // Only seek from the start — respect a listener who already moved (a pending
      // chapter seek always applies: it was requested for this exact load).
      if (pending !== null || audio.currentTime <= 1) {
        audio.currentTime = target;
        log('audiobook', pending !== null ? 'chapter-seek' : 'resumed', {
          id: id ?? '',
          seconds: String(Math.round(target)),
        });
      }
      done = true;
    };

    if (audio.readyState >= 1) tryResume(); // metadata already available
    audio.addEventListener('loadedmetadata', tryResume);
    return () => audio.removeEventListener('loadedmetadata', tryResume);
  }, [ref, current, id]);
}
