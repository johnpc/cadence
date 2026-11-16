import { takePendingSeek } from '../pendingSeek';
import type { JellyfinItem } from '../../../lib/jellyfinTypes';
import type { AudioLike, EngineDeps, LogFn } from './types';

/**
 * Arm the one-shot "resume here" for a fresh load: once the element reports
 * metadata, seek to a pending seek for this track (a chapter tap, or the
 * position saved before an error reload — it always applies), else to the
 * audiobook's saved position read live from the server (only while playback is
 * still at the start, so a listener who already scrubbed is never yanked back).
 * Music has no saved position (`resumeAt` → null) and is untouched.
 *
 * Armed AFTER the new src is set, so it can never act on the previous track's
 * metadata. Returns a disarm for the next load.
 */
export function armResume(
  audio: AudioLike,
  track: JellyfinItem,
  isActive: () => boolean,
  resumeAt: EngineDeps['resumeAt'],
  log: LogFn,
): () => void {
  let done = false;
  const seekTo = (target: number, kind: 'chapter-seek' | 'resumed') => {
    if (kind === 'resumed' && audio.currentTime > 1) return;
    audio.currentTime = target;
    log('audiobook', kind, { id: track.Id, seconds: String(Math.round(target)) });
  };
  const tryResume = () => {
    if (done || !isActive()) return;
    done = true;
    const pending = takePendingSeek(track.Id);
    if (pending !== null) return seekTo(pending, 'chapter-seek');
    void resumeAt(track, audio.duration || 0).then(
      (target) => {
        if (target !== null && isActive()) seekTo(target, 'resumed');
      },
      () => undefined,
    );
  };
  if (audio.readyState >= 1) tryResume();
  audio.addEventListener('loadedmetadata', tryResume);
  return () => audio.removeEventListener('loadedmetadata', tryResume);
}
