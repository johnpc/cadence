/** Typed errors + timing for the Navidrome/Subsonic request layer, split out
 * so navidromeFetch stays lean. */

/** Thrown on Subsonic error code 40 (wrong username/token) — a CONFIRMED dead
 * session, so resolveSession can distinguish it from a transient failure. */
export class Unauthenticated extends Error {
  constructor() {
    super('Unauthenticated');
    this.name = 'Unauthenticated';
  }
}

/** Thrown when a request exceeds REQUEST_TIMEOUT_MS — a transient failure, so
 * a stalled Navidrome call fails fast (and react-query can retry) instead of
 * hanging forever and leaving the UI on a spinner. */
export class RequestTimeout extends Error {
  constructor() {
    super('Request timed out');
    this.name = 'RequestTimeout';
  }
}

/** Thrown on a non-2xx HTTP response — a TRANSPORT-level failure (a proxy,
 * tunnel, or server error), distinct from a Subsonic application error (see
 * SubsonicError). Carries the HTTP status so retry logic can tell a
 * transient 5xx (worth retrying) from a permanent 4xx. */
export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`Navidrome request failed: ${status}`);
    this.name = 'HttpError';
  }
}

/** Thrown when the HTTP call itself succeeds but the Subsonic envelope
 * reports `status: "failed"` with an error code OTHER than 40 (handled
 * separately as Unauthenticated) — e.g. 50 (unauthorized for this
 * operation) or 70 (data not found). Terminal: retrying returns the same
 * answer. */
export class SubsonicError extends Error {
  constructor(
    readonly code: number,
    message?: string,
  ) {
    super(message || `Subsonic request failed: code ${code}`);
    this.name = 'SubsonicError';
  }
}

/** Per-request ceiling. Navidrome is normally sub-second, but a server behind
 * a tunnel/proxy that has gone idle can COLD-START the first request to
 * ~15s before it warms to sub-second. A 12s ceiling aborted that first
 * request — sign-in would fail on a cold server for a real user, not just in
 * CI — so allow 30s: still bounded (no indefinite hang), but above the
 * cold-start worst case. */
export const REQUEST_TIMEOUT_MS = 30_000;

/** True for failures worth retrying: timeouts and 5xx/network errors — but
 * NOT Unauthenticated (a confirmed dead session; retrying hides it) and NOT
 * a SubsonicError (a business-level failure like "not found" won't change on
 * retry) or a 4xx HttpError (a deleted/missing item won't appear on retry —
 * retrying just wastes two backoff rounds before the error shows). */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof Unauthenticated) return false;
  if (error instanceof SubsonicError) return false;
  if (error instanceof HttpError) return error.status >= 500;
  return true;
}
