import { useSyncExternalStore } from 'react';
import { contextFor, getPlayContext, subscribePlayContext, type PlayContext } from './playContext';

/** The "Playing from …" context for the currently-playing track, or null when
 * playback isn't tied to a known collection. Re-renders when the context or the
 * track changes. */
export function usePlayContext(currentTrackId: string | undefined): PlayContext | null {
  const ctx = useSyncExternalStore(subscribePlayContext, getPlayContext);
  // Recompute membership against the live track — `ctx` is only the dependency
  // that makes React re-read; the actual guard is contextFor's set check.
  void ctx;
  return contextFor(currentTrackId);
}
