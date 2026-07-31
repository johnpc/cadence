/**
 * Jellyfin authentication endpoints. Thin wrappers over `request` so the auth
 * feature (authClient/resolveSession) stays declarative and testable.
 */
import { request, Unauthenticated } from './jellyfinFetch';
import type { AuthResult, JellyfinUser, Session } from './jellyfinTypes';

/** Sign in with a Jellyfin username + password → the session token + userId. */
export async function authenticateByName(username: string, password: string): Promise<Session> {
  const result = await request<AuthResult>('/Users/AuthenticateByName', {
    method: 'POST',
    body: { Username: username, Pw: password },
  });
  return {
    token: result.AccessToken,
    userId: result.User.Id,
    isAdmin: result.User.Policy?.IsAdministrator === true,
  };
}

const backoff = (attempt: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 300 * attempt));

/**
 * Validate a persisted session by fetching the current user. Returns the user
 * on success, null ONLY on a CONFIRMED dead token, and throws on a transient
 * failure so the caller keeps trusting the session rather than signing out.
 *
 * A revoked token 401s on EVERY call; a transient 401 (Jellyfin under load, a
 * cloudflared-tunnel hiccup) does not. So a single 401 is NOT treated as dead —
 * we re-check up to `retries` times and return null only if it 401s on every
 * attempt. A non-401 error still throws immediately (undetermined → trust the
 * token). This stops a spurious 401 from booting a user on a flaky connection.
 */
export async function validateToken(
  session: Session,
  retries = 2,
  delay: (attempt: number) => Promise<void> = backoff,
): Promise<JellyfinUser | null> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await request<JellyfinUser>('/Users/Me', { token: session.token });
    } catch (error) {
      if (!(error instanceof Unauthenticated)) throw error; // transient → caller trusts
      if (attempt >= retries) return null; // 401 on every attempt → confirmed dead
      await delay(attempt + 1);
    }
  }
}
