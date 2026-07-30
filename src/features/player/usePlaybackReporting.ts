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
 */
export function usePlaybackReporting(
  currentId: string | undefined,
  getPosition: () => number,
  isAudiobook = false,
) {
  const posRef = useRef(getPosition);
  posRef.current = getPosition;

  useEffect(() => {
    if (!currentId) return;
    void reportPlaybackStart(currentId);
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
  }, [currentId, isAudiobook]);
}
