import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * A sleep timer: arm it for N minutes and `onFire` runs when it elapses (the
 * provider wires that to pausing playback). Arming again resets it; 0/undefined
 * cancels. Exposes the armed minute count for the UI.
 */
export function useSleepTimer(onFire: () => void) {
  const [sleepMinutes, setSleepMinutes] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fireRef = useRef(onFire);
  fireRef.current = onFire;

  const clear = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  }, []);

  const armSleep = useCallback(
    (minutes: number | null) => {
      clear();
      setSleepMinutes(minutes && minutes > 0 ? minutes : null);
      if (minutes && minutes > 0) {
        timeoutRef.current = setTimeout(
          () => {
            fireRef.current();
            setSleepMinutes(null);
          },
          minutes * 60 * 1000,
        );
      }
    },
    [clear],
  );

  useEffect(() => clear, [clear]);

  return { sleepMinutes, armSleep };
}
