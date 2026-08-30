import { useEffect } from 'react';
import { getPlayIntent } from './playIntentStore';
import { log } from '../../lib/diagnostics/diagnosticsStore';

/** How long a buffering stall may last before we intervene. Generous enough for
 * the cloudflared tunnel + a cold Jellyfin transcode (a few seconds), short
 * enough to act well inside iOS's patience with a silent backgrounded app. */
export const STALL_TIMEOUT_MS = 20_000;

/**
 * Watchdog for indefinite buffering stalls. Device diagnostics showed a track
 * enter "buffering stall" in the background and never recover — no error event,
 * no progress, just silence until iOS suspended the app ~10s later (and with it
 * the whole session + the OS Now Playing slot, which is why a Bluetooth
 * reconnect then resumed some other app). The element only fires `error` for
 * hard failures; a stream that stays pending forever fires nothing — so nothing
 * routed into the existing retry-then-skip recovery.
 *
 * While `waiting` is true, arm a timer; any progress (position change) or
 * leaving the waiting state re-arms/clears it. If it fires and the user still
 * intends to be playing, invoke `onStall` — wired to the SAME handler as a hard
 * error, so recovery is: reload the track once, then skip past it.
 */
export function useStallWatchdog(
  waiting: boolean,
  position: number,
  onStall: () => void,
  timeoutMs: number = STALL_TIMEOUT_MS,
): void {
  useEffect(() => {
    if (!waiting) return;
    const t = setTimeout(() => {
      // A deliberate pause can leave the element mid-buffer — never "recover"
      // (and unpause) something the user chose to stop.
      if (!getPlayIntent()) return;
      log('stall-watchdog', 'stalled too long — recovering', {
        waitedMs: String(timeoutMs),
        pos: position.toFixed(1),
      });
      onStall();
    }, timeoutMs);
    return () => clearTimeout(t);
    // `position` is a dep on purpose: any progress while waiting re-arms the
    // timer, so only a genuinely frozen stream ever reaches the timeout.
  }, [waiting, position, onStall, timeoutMs]);
}
