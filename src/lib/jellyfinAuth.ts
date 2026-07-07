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
  return { token: result.AccessToken, userId: result.User.Id };
}

/**
 * Validate a persisted session by fetching the current user. Returns the user
 * on success, null on a CONFIRMED bad token (401). Transient failures throw so
 * the caller can retry rather than sign the user out.
 */
export async function validateToken(session: Session): Promise<JellyfinUser | null> {
  try {
    return await request<JellyfinUser>('/Users/Me', { token: session.token });
  } catch (error) {
    if (error instanceof Unauthenticated) return null;
    throw error;
  }
}
