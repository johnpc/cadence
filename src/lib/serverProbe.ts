/**
 * Ask the server, cheaply and briefly, whether it is there. Used when a stream
 * fails and nothing else has told us yet whether we're offline: a dead stream
 * may BE the outage. A response (any status) means reachable; no response
 * within `timeoutMs` — a refused, dropped or hanging connection — means not.
 * Either answer updates the shared reachability store.
 */
import { apiUrl } from './jellyfinConfig';
import { markReachable, markUnreachable } from './reachabilityStore';

export const PROBE_TIMEOUT_MS = 3_000;

export async function probeServer(timeoutMs: number = PROBE_TIMEOUT_MS): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(apiUrl('/System/Info/Public'), { signal: controller.signal });
    markReachable();
    return true;
  } catch {
    markUnreachable();
    return false;
  } finally {
    clearTimeout(timer);
  }
}
