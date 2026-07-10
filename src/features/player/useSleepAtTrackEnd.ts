import { useRef } from 'react';
import type { SleepAtTrackEnd } from './usePlaybackHandlers';

/**
 * Owns the two refs the ended-handler reads to honour an "end of track" sleep
 * timer, kept out of PlayerProvider for the line gate. `active` is flipped by
 * useSleepTimer; `onReached` is populated by the provider (pause + disarm) after
 * those controls exist. Returns the ref bundle for both the handler and the
 * provider to share.
 */
export function useSleepAtTrackEnd(): SleepAtTrackEnd & { setOnReached: (fn: () => void) => void } {
  const active = useRef(false);
  const onReached = useRef<() => void>(() => {});
  return {
    active,
    onReached,
    setOnReached: (fn: () => void) => {
      onReached.current = fn;
    },
  };
}
