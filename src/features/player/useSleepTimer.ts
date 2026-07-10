import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/** What the sleep timer is set to: a minute count, 'track' (stop when the
 * current song ends), or null (off). */
export type SleepMode = number | 'track' | null;

/**
 * A sleep timer: arm it for N minutes OR 'track' (stop at the end of the
 * current song) and `onFire` runs when it elapses (the provider wires that to
 * pausing playback). Arming again resets it; null cancels. For 'track' mode
 * there's no timeout — instead `stopAfterTrackRef` is flipped on, and the
 * player's `ended` handler reads it to pause (and disarm) when THIS track
 * finishes naturally; a manual skip takes a different path so it won't trip it.
 */
export function useSleepTimer(onFire: () => void, stopAfterTrackRef: RefObject<boolean>) {
  const [sleepMode, setSleepMode] = useState<SleepMode>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fireRef = useRef(onFire);
  fireRef.current = onFire;

  const clear = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const armSleep = useCallback(
    (mode: SleepMode) => {
      clear();
      const next: SleepMode = mode === 'track' ? 'track' : mode && mode > 0 ? mode : null;
      setSleepMode(next);
      stopAfterTrackRef.current = next === 'track';
      if (typeof next === 'number') {
        timeoutRef.current = setTimeout(
          () => {
            fireRef.current();
            setSleepMode(null);
          },
          next * 60 * 1000,
        );
      }
    },
    [clear, stopAfterTrackRef],
  );

  useEffect(() => clear, [clear]);

  return { sleepMode, armSleep };
}
