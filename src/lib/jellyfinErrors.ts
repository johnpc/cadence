/** Typed errors + timing for the Jellyfin request layer, split out so
 * jellyfinFetch stays lean. */

/** Thrown on a 401 — the token is invalid/revoked (a CONFIRMED no-session), so
 * resolveSession can distinguish a dead session from a transient failure. */
export class Unauthenticated extends Error {
  constructor() {
    super('Unauthenticated');
    this.name = 'Unauthenticated';
  }
}

/** Thrown when a request exceeds REQUEST_TIMEOUT_MS — a transient failure, so a
 * stalled Jellyfin call fails fast (and react-query can retry) instead of
 * hanging forever and leaving the UI on a spinner. */
export class RequestTimeout extends Error {
  constructor() {
    super('Request timed out');
    this.name = 'RequestTimeout';
  }
}

/** Per-request ceiling. Jellyfin is normally sub-second, but a server behind a
 * tunnel/proxy that has gone idle can COLD-START the first request to ~15s
 * (measured on cloudflared) before it warms to sub-second. A 12s ceiling
 * aborted that first request — sign-in would fail on a cold server for a real
 * user, not just in CI — so allow 30s: still bounded (no indefinite hang), but
 * above the cold-start worst case. */
export const REQUEST_TIMEOUT_MS = 30_000;

/** True for failures worth retrying — a timeout or a 5xx/network error, but
 * NOT a 401 (a confirmed dead session — retrying is pointless and hides it). */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Unauthenticated) return false;
  return true;
}
