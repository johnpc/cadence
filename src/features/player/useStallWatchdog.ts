import { useEffect, useRef, type RefObject } from 'react';
import { getPlayIntent } from './playIntentStore';
import { log } from '../../lib/diagnostics/diagnosticsStore';

/** How long a buffering stall may last before we intervene. Matches the e2e
 * suite's DATA_WAIT (45s): that's the measured worst case for the cloudflared
 * tunnel + a cold Jellyfin transcode. A shorter budget (20s) would "recover"
 * streams that were about to succeed — restarting or skipping a track the
 * network was legitimately still delivering. */
export const STALL_TIMEOUT_MS = 45_000;

/**
 * Watchdog for indefinite buffering stalls. Device diagnostics showed a track
 * enter "buffering stall" in the background and never recover — no error event,
 * no progress, just silence until iOS suspended the app (and with it the OS Now
 * Playing slot, which is why a Bluetooth reconnect then resumed some other
 * app). The element only fires `error` for hard failures; a stream that stays
 * pending forever fires nothing — so nothing routed into the existing
 * retry-then-skip recovery.
 *
 * While `waiting` is true, arm a timer; any progress (position change) or
 * leaving the waiting state re-arms/clears it. It fires ONLY when the element
 * is genuinely trying to play (`!paused`) and the user still intends playback:
 * a deliberate pause, an OS interruption (call/Siri — iOS pauses the element
 * but play-intent survives by design), or a cast handoff (the loader pauses the
 * local element) can all strand `waiting` latched true, and none of them is a
 * stall to recover from. `onStall` routes into the SAME handler as a hard
 * error: reload the track once (position preserved via pendingSeek), then skip.
 */
export function useStallWatchdog(
  audioRef: RefObject<HTMLAudioElement | null>,
  waiting: boolean,
  position: number,
  onStall: () => void,
  timeoutMs: number = STALL_TIMEOUT_MS,
): void {
  // Keep the latest callback without re-arming the timer on re-renders: an
  // inline `onStall` gets a new identity every render, and a dep on it would
  // silently reset the countdown whenever anything re-rendered mid-stall.
  const onStallRef = useRef(onStall);
  onStallRef.current = onStall;

  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => {
      const audio = audioRef.current;
      // Paused (deliberate, interruption, or casting) or no longer intended →
      // never "recover" (and restart/skip) something the user didn't lose.
      if (!audio || audio.paused || !getPlayIntent()) return;
      log('stall-watchdog', 'stalled too long — recovering', {
        waitedMs: String(timeoutMs),
        pos: position.toFixed(1),
      });
      onStallRef.current();
    }, timeoutMs);
    return () => clearTimeout(t);
    // `position` is a dep on purpose: any progress while waiting re-arms the
    // timer, so only a genuinely frozen stream ever reaches the timeout.
  }, [audioRef, waiting, position, timeoutMs]);
}
