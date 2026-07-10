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

/** Thrown on a non-2xx that isn't a 401 — carries the HTTP status so retry logic
 * can tell a transient 5xx (worth retrying) from a client 4xx like 404
 * (a deleted/missing item — retrying only wastes time and delays the error). */
export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`Jellyfin request failed: ${status}`);
    this.name = 'HttpError';
  }
}

/** Per-request ceiling. Jellyfin is normally sub-second, but a server behind a
 * tunnel/proxy that has gone idle can COLD-START the first request to ~15s
 * (measured on cloudflared) before it warms to sub-second. A 12s ceiling
 * aborted that first request — sign-in would fail on a cold server for a real
 * user, not just in CI — so allow 30s: still bounded (no indefinite hang), but
 * above the cold-start worst case. */
export const REQUEST_TIMEOUT_MS = 30_000;

/** True for failures worth retrying: timeouts and 5xx/network errors — but NOT a
 * 401 (a confirmed dead session; retrying hides it) and NOT a 4xx client error
 * like 404 (a deleted/missing item won't appear on retry — retrying just wastes
 * two backoff rounds before the error shows). An HttpError with a 4xx status is
 * terminal; anything else (network drop, RequestTimeout, 5xx) is transient. */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Unauthenticated) return false;
  if (error instanceof HttpError) return error.status >= 500;
  return true;
}
