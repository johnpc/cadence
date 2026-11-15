import { useEffect, useRef } from 'react';
import {
  reportPlaybackStart,
  reportPlaybackProgress,
  reportPlaybackStopped,
  savePlaybackPosition,
} from '../../lib/jellyfinPlayback';

/**
 * Reports playback to Jellyfin so tracks count as played (feeds play counts +
 * Recently Played). Fires Start the moment a track ACTUALLY starts playing,
 * Progress every 10s, and Stopped when the track changes or the player unmounts.
 * `getPosition` reads the live position without re-subscribing to every tick.
 *
 * A track that never played — the queue restored paused at launch — reports
 * NOTHING. Jellyfin resets the saved resume position on any Progress/Stopped
 * report (verified live on 12.1, whatever PositionTicks says), so reporting the
 * restored track's 0 wiped an audiobook's place within 10s of relaunch.
 *
 * For AUDIOBOOKS the position is ALSO written to the item's UserData
 * (savePlaybackPosition): the Sessions endpoints don't just drop it for books,
 * every Progress/Stopped report RESETS it to 0 (verified live on 12.1) — so each
 * write happens strictly AFTER the report it accompanies has landed.
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
  const startedFor = useRef<string | undefined>(undefined);

  // Start: once per track, the first time it is really playing.
  useEffect(() => {
    if (!currentId || !isPlaying || startedFor.current === currentId) return;
    startedFor.current = currentId;
    void Promise.resolve(reportPlaybackStart(currentId)).then(
      () => onReported?.(),
      () => undefined,
    );
  }, [currentId, isPlaying, onReported]);

  // Progress ticks + Stopped, only for a track that reported Start.
  useEffect(() => {
    if (!currentId) return;
    const timer = setInterval(() => {
      if (startedFor.current !== currentId) return;
      const pos = posRef.current();
      if (pos <= 0) return;
      // Progress ALSO resets the server-side position for books (like Stopped), so
      // the UserData write must land after it, never race it.
      const progress = Promise.resolve(reportPlaybackProgress(currentId, pos));
      if (isAudiobook) void progress.then(() => savePlaybackPosition(currentId, pos));
    }, 10_000);
    return () => {
      clearInterval(timer);
      if (startedFor.current !== currentId) return;
      startedFor.current = undefined;
      const pos = posRef.current();
      const stopped = Promise.resolve(reportPlaybackStopped(currentId, pos));
      if (isAudiobook && pos > 0) void stopped.then(() => savePlaybackPosition(currentId, pos));
    };
  }, [currentId, isAudiobook]);
}
