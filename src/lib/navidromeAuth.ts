/**
 * Navidrome authentication. Sign-in uses Navidrome's native POST /auth/login
 * (not a Subsonic-namespaced endpoint) to obtain the Subsonic salt+token pair
 * WITHOUT Cadence ever computing md5 itself or persisting the plaintext
 * password. Session validation uses the cheap Subsonic getUser call.
 */
import { apiUrl } from './navidromeConfig';
import { request, Unauthenticated } from './navidromeFetch';
import { REQUEST_TIMEOUT_MS } from './navidromeErrors';
import type { LoginResponse, NavidromeUser, Session } from './navidromeTypes';

/**
 * Sign in with a Navidrome username + password → the Subsonic session
 * credentials. The ONE call that reaches the server without `u`/`t`/`s` (it
 * produces them) — a plain JSON POST, not a Subsonic REST call, so it
 * bypasses `request()` entirely.
 */
export async function authenticateByName(username: string, password: string): Promise<Session> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(apiUrl('/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (res.status === 401) throw new Unauthenticated();
  if (!res.ok) throw new Error(`Navidrome sign-in failed: ${res.status}`);
  const result = (await res.json()) as LoginResponse;
  return {
    username: result.username,
    userId: result.id,
    subsonicSalt: result.subsonicSalt,
    subsonicToken: result.subsonicToken,
  };
}

/**
 * Validate a persisted session via the cheap Subsonic getUser endpoint.
 * Returns true on success, false on a CONFIRMED bad credential
 * (Unauthenticated — Subsonic error code 40). Transient failures throw so the
 * caller can retry rather than sign the user out.
 */
export async function validateToken(session: Session): Promise<boolean> {
  try {
    await request<NavidromeUser>('/getUser', { session });
    return true;
  } catch (error) {
    if (error instanceof Unauthenticated) return false;
    throw error;
  }
}
