import { useEffect, type RefObject } from 'react';
import { liveResumeSeconds } from './liveResumeSeconds';
import { takePendingSeek } from '../player/pendingSeek';
import { log } from '../../lib/diagnostics/diagnosticsStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Silently resume an audiobook where the listener left off. When the current
 * track is an audiobook, seek to its saved position once the audio element
 * reports a usable duration (loadedmetadata) — but only ONCE per track, and only
 * if playback is still at the very start (so we never yank a listener who has
 * already scrubbed). Music is untouched (liveResumeSeconds returns null).
 *
 * The position is read LIVE from the server, not from the item the player holds:
 * a queue restored at launch is a frozen snapshot whose UserData is stale
 * (usually 0), so trusting it made resumed books start over. The live read is
 * the source of truth savePlaybackPosition writes to each tick.
 *
 * A one-shot pending seek (a chapter tapped on the detail page before the track
 * loaded) takes priority over the saved position — the listener asked for that
 * exact spot — and applies synchronously without waiting on the network.
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

    const seekTo = (target: number, kind: 'chapter-seek' | 'resumed') => {
      // Only seek from the start — respect a listener who already moved (a pending
      // chapter seek always applies: it was requested for this exact load).
      if (kind === 'chapter-seek' || audio.currentTime <= 1) {
        audio.currentTime = target;
        log('audiobook', kind, { id: id ?? '', seconds: String(Math.round(target)) });
      }
    };

    const tryResume = () => {
      if (done) return;
      done = true;
      // An explicit chapter tap wins over the saved position — apply it now.
      const pending = takePendingSeek(id);
      if (pending !== null) return seekTo(pending, 'chapter-seek');
      // Otherwise read the live server position (async); guard against the track
      // changing while that read is in flight.
      void liveResumeSeconds(current, audio.duration || 0).then((target) => {
        if (target !== null && ref.current === audio) seekTo(target, 'resumed');
      });
    };

    if (audio.readyState >= 1) tryResume(); // metadata already available
    audio.addEventListener('loadedmetadata', tryResume);
    return () => audio.removeEventListener('loadedmetadata', tryResume);
  }, [ref, current, id]);
}
