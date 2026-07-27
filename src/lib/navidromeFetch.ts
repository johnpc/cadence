/**
 * The core Subsonic/Navidrome request wrapper. Builds the query string (auth
 * params + any call-specific params), unwraps the `subsonic-response`
 * envelope every endpoint returns, and throws a typed error on failure. A
 * Subsonic error code 40 throws an `Unauthenticated` sentinel so
 * resolveSession can distinguish a dead session from a transient failure.
 * Every request is bounded by REQUEST_TIMEOUT_MS so a stalled server fails
 * fast (→ retryable) instead of hanging the UI forever.
 */
import { restUrl, subsonicAuthParams } from './navidromeConfig';
import { getSession } from './sessionStore';
import { notifySessionExpired } from './sessionExpiry';
import {
  Unauthenticated,
  RequestTimeout,
  HttpError,
  SubsonicError,
  REQUEST_TIMEOUT_MS,
} from './navidromeErrors';
import type { Session } from './navidromeTypes';

export { Unauthenticated, RequestTimeout, HttpError, SubsonicError } from './navidromeErrors';

type ParamValue = string | number | boolean | string[] | undefined;

export interface RequestOptions {
  method?: 'GET' | 'POST';
  /** Call-specific query params (repeatable ones, e.g. `id`, pass as an
   * array — each value is appended under the same key). */
  params?: Record<string, ParamValue>;
  /** Override the active session — used by callers validating a session
   * that isn't (yet) the module-scoped active one. */
  session?: Session | null;
}

function buildParams(session: Session | null, extra?: Record<string, ParamValue>): URLSearchParams {
  const params = subsonicAuthParams(session);
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else params.set(key, String(value));
  }
  return params;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', params, session = getSession() } = options;
  const query = buildParams(session, params);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    const isGet = method === 'GET';
    res = await fetch(isGet ? `${restUrl(path)}?${query}` : restUrl(path), {
      method,
      headers: isGet ? undefined : { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: isGet ? undefined : query.toString(),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw new RequestTimeout();
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) throw new HttpError(res.status);

  const text = await res.text();
  const body = (text ? JSON.parse(text) : {}) as {
    'subsonic-response'?: { status: 'ok' | 'failed'; error?: { code: number; message: string } };
  };
  const envelope = body['subsonic-response'];
  if (envelope?.status === 'failed') {
    const code = envelope.error?.code ?? 0;
    if (code === 40) {
      notifySessionExpired();
      throw new Unauthenticated();
    }
    throw new SubsonicError(code, envelope.error?.message);
  }
  return envelope as T;
}
