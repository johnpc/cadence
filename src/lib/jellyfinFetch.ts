/**
 * The core Jellyfin request wrapper. Prepends the base URL, attaches the auth
 * HEADER (never a query param — that only belongs on <audio>/<img> src), JSON-
 * encodes the body, and throws a typed error on non-2xx. A 401 throws an
 * `Unauthenticated` sentinel so resolveSession can distinguish a dead session
 * from a transient failure.
 */
import { apiUrl, embyAuthHeader } from './jellyfinConfig';
import { getSession } from './sessionStore';

/** Thrown on a 401 — the token is invalid/revoked (a CONFIRMED no-session). */
export class Unauthenticated extends Error {
  constructor() {
    super('Unauthenticated');
    this.name = 'Unauthenticated';
  }
}

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

  const res = await fetch(apiUrl(path), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 401) throw new Unauthenticated();
  if (!res.ok) throw new Error(`Jellyfin ${method} ${path} failed: ${res.status}`);
  if (res.status === 204) return undefined as T;

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
