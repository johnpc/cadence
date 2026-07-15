import { useCallback, useRef, useState } from 'react';

/** A "reload the current track" nonce. On a load error we want to re-derive the
 * stream URL and try the SAME track again (e.g. the launch race where the src was
 * built before the session was ready, or a transient network blip) before giving
 * up and skipping. `nonce` is a dep of useTrackLoader; `requestReload` bumps it,
 * bounded to `maxRetries` per track so a genuinely-bad track still skips instead
 * of looping forever. `resetFor` clears the counter when the track changes. */
export function useTrackReload(maxRetries = 1) {
  const [nonce, setNonce] = useState(0);
  const retriesRef = useRef(0);
  const trackRef = useRef<string | undefined>(undefined);

  const resetFor = useCallback((trackId: string | undefined) => {
    if (trackRef.current !== trackId) {
      trackRef.current = trackId;
      retriesRef.current = 0;
    }
  }, []);

  /** Attempt a reload; returns true if a retry was scheduled, false when the
   * per-track retry budget is exhausted (caller should then skip). */
  const requestReload = useCallback(
    (trackId: string | undefined): boolean => {
      resetFor(trackId);
      if (retriesRef.current >= maxRetries) return false;
      retriesRef.current += 1;
      setNonce((n) => n + 1);
      return true;
    },
    [maxRetries, resetFor],
  );

  return { nonce, requestReload, resetFor };
}
