import { useEffect, useRef } from 'react';
import {
  reportPlaybackStart,
  reportPlaybackProgress,
  reportPlaybackStopped,
  savePlaybackPosition,
} from '../../lib/jellyfinPlayback';

/**
 * Reports playback to Jellyfin so tracks count as played (feeds play counts +
 * Recently Played). Fires Start on each new track, Progress every 10s, and
 * Stopped when the track changes or the player unmounts. `getPosition` reads
 * the live position without re-subscribing this effect to every tick.
 *
 * For AUDIOBOOKS it ALSO persists the position on the item's UserData
 * (savePlaybackPosition): the /Sessions/Playing endpoints silently drop the
 * resume position for books (verified live — 204 but saved 0), so without this
 * "resume where you left off" never sticks. Written each tick + on stop.
 *
 * `onReported` fires once the Start report has landed on the server — the
 * moment play-derived data (Recently played, On repeat) is actually new.
 */
export function usePlaybackReporting(
  currentId: string | undefined,
  getPosition: () => number,
  isAudiobook = false,
  onReported?: () => void,
) {
  const posRef = useRef(getPosition);
  posRef.current = getPosition;

  useEffect(() => {
    if (!currentId) return;
    void Promise.resolve(reportPlaybackStart(currentId)).then(
      () => onReported?.(),
      () => undefined,
    );
    const timer = setInterval(() => {
      const pos = posRef.current();
      void reportPlaybackProgress(currentId, pos);
      if (isAudiobook) void savePlaybackPosition(currentId, pos);
    }, 10_000);
    return () => {
      clearInterval(timer);
      const pos = posRef.current();
      void reportPlaybackStopped(currentId, pos);
      if (isAudiobook) void savePlaybackPosition(currentId, pos);
    };
  }, [currentId, isAudiobook, onReported]);
}
