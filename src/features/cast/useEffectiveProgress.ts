import { useMemo } from 'react';
import { useCast } from './useCast';
import { useCastProgress } from './useCastProgress';

/** The progress the scrubber should show: the RECEIVER's position while casting
 * (the local audio is paused then), else the local element's. Memoized so the
 * player's progress context only changes on an actual tick. */
export function useEffectiveProgress(position: number, duration: number) {
  const { connected } = useCast();
  const castProgress = useCastProgress();
  return useMemo(
    () => (connected ? castProgress : { position, duration }),
    [connected, castProgress, position, duration],
  );
}
