import { useEffect, useRef } from 'react';
import {
  reportPlaybackStart,
  reportPlaybackProgress,
  reportPlaybackStopped,
} from '../../lib/jellyfinPlayback';

/**
 * Reports playback to Jellyfin so tracks count as played (feeds play counts +
 * Recently Played). Fires Start on each new track, Progress every 10s, and
 * Stopped when the track changes or the player unmounts. `getPosition` reads
 * the live position without re-subscribing this effect to every tick.
 */
export function usePlaybackReporting(currentId: string | undefined, getPosition: () => number) {
  const posRef = useRef(getPosition);
  posRef.current = getPosition;

  useEffect(() => {
    if (!currentId) return;
    void reportPlaybackStart(currentId);
    const timer = setInterval(() => {
      void reportPlaybackProgress(currentId, posRef.current());
    }, 10_000);
    return () => {
      clearInterval(timer);
      void reportPlaybackStopped(currentId, posRef.current());
    };
  }, [currentId]);
}
