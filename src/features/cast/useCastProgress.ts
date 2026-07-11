import { useSyncExternalStore } from 'react';
import { getCastProgress, onCastProgressChange } from './castProgress';

/** The receiver's live playback position/duration while casting, as reactive
 * state. Drives the player's scrubber so it reflects the TV (the local audio
 * element is paused during a cast). */
export function useCastProgress() {
  return useSyncExternalStore(onCastProgressChange, getCastProgress, getCastProgress);
}
