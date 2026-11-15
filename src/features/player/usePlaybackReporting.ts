import { useEffect, useRef, useState } from 'react';
import {
  beaconPlaybackPosition,
  reportPlaybackStart,
  reportPlaybackProgress,
  reportPlaybackStopped,
  savePlaybackPosition,
} from '../../lib/jellyfinPlayback';

/**
 * Reports playback to Jellyfin so tracks count as played (feeds play counts +
 * Recently Played). Fires Start the moment a track ACTUALLY starts playing,
 * Progress every 10s of playback after that, and Stopped when the track changes
 * or the player unmounts. `getPosition` reads the live position without
 * re-subscribing to every tick.
 *
 * A track that never played — the queue restored paused at launch — reports
 * NOTHING. Jellyfin resets the saved resume position on any Progress/Stopped
 * report (verified live on 12.1, whatever PositionTicks says), so reporting the
 * restored track's 0 wiped an audiobook's place within 10s of relaunch.
 *
 * For AUDIOBOOKS the position is ALSO written to the item's UserData
 * (savePlaybackPosition) — strictly AFTER the report it accompanies (the report
 * zeroes it) — and beaconed on pagehide so closing the app keeps the place.
 *
 * `onReported` fires once the Start report has landed on the server — the
 * moment play-derived data (Recently played, On repeat) is actually new.
 */
export function usePlaybackReporting(
  currentId: string | undefined,
  getPosition: () => number,
  isAudiobook = false,
  onReported?: () => void,
  isPlaying = true,
) {
  const posRef = useRef(getPosition);
  posRef.current = getPosition;
  const [startedId, setStartedId] = useState<string | undefined>(undefined);

  // Start: once per track, the first time it is really playing.
  useEffect(() => {
    if (!currentId || !isPlaying || startedId === currentId) return;
    setStartedId(currentId);
    void Promise.resolve(reportPlaybackStart(currentId)).then(
      () => onReported?.(),
      () => undefined,
    );
  }, [currentId, isPlaying, startedId, onReported]);

  // Ticks (from playback start, not mount) + pagehide + Stopped — only for a
  // track that reported Start.
  useEffect(() => {
    if (!currentId || startedId !== currentId) return;
    const timer = setInterval(() => {
      const pos = posRef.current();
      if (pos <= 0) return;
      const progress = Promise.resolve(reportPlaybackProgress(currentId, pos));
      if (isAudiobook) void progress.then(() => savePlaybackPosition(currentId, pos));
    }, 10_000);
    const onHide = () => {
      const pos = posRef.current();
      if (isAudiobook && pos > 0) beaconPlaybackPosition(currentId, pos);
    };
    window.addEventListener('pagehide', onHide);
    return () => {
      clearInterval(timer);
      window.removeEventListener('pagehide', onHide);
      const pos = posRef.current();
      const stopped = Promise.resolve(reportPlaybackStopped(currentId, pos));
      if (isAudiobook && pos > 0) void stopped.then(() => savePlaybackPosition(currentId, pos));
    };
  }, [currentId, startedId, isAudiobook]);
}
