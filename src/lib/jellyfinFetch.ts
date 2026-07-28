/**
 * The core Jellyfin request wrapper. Prepends the base URL, attaches the auth
 * HEADER (never a query param — that only belongs on <audio>/<img> src), JSON-
 * encodes the body, and throws a typed error on non-2xx. A 401 throws an
 * `Unauthenticated` sentinel so resolveSession can distinguish a dead session
 * from a transient failure. Every request is bounded by REQUEST_TIMEOUT_MS so a
 * stalled server fails fast (→ retryable) instead of hanging the UI forever.
 */
import { apiUrl, embyAuthHeader } from './jellyfinConfig';
import { getSession } from './sessionStore';
import { notifySessionExpired } from './sessionExpiry';
import { markReachable, markUnreachable } from './reachabilityStore';
import { Unauthenticated, RequestTimeout, HttpError, REQUEST_TIMEOUT_MS } from './jellyfinErrors';

export { Unauthenticated, RequestTimeout, HttpError } from './jellyfinErrors';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'DELETE';
  body?: unknown;
  /** Override the session token (used by sign-in, before the session is set). */
  token?: string;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token = getSession()?.token } = options;
  const headers: Record<string, string> = {
    'X-Emby-Authorization': embyAuthHeader(token),
  };
  if (token) headers['Authorization'] = `MediaBrowser Token="${token}"`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(apiUrl(path), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    // Reached no response: either a timeout or a network error → we're offline.
    markUnreachable();
    if (err instanceof DOMException && err.name === 'AbortError') throw new RequestTimeout();
    throw err;
  } finally {
    clearTimeout(timer);
  }

  // Got a response (ANY status, incl. 401/404) → the server is reachable. This
  // is what flips the app from offline-first `pending` to confirmed `online`.
  markReachable();

  if (res.status === 401) {
    // Tell the auth layer the token was rejected so it can re-validate / sign
    // out — otherwise a mid-session expiry fails silently everywhere.
    notifySessionExpired();
    throw new Unauthenticated();
  }
  if (!res.ok) throw new HttpError(res.status);
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
