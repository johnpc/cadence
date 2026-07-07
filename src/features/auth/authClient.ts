/**
 * Thin wrapper over the Jellyfin auth endpoints + durable session storage.
 * Isolates all session side-effects so AuthProvider stays declarative and tests
 * mock a single module. Mirrors stoop's authClient shape.
 */
import { authenticateByName, validateToken } from '../../lib/jellyfinAuth';
import { setSession } from '../../lib/sessionStore';
import { clearStoredSession, loadStoredSession, storeSession } from '../../lib/sessionPersistence';

/**
 * The signed-in user's username, or null on a CONFIRMED no-session. A transient
 * failure (network / cold-start storage) is rethrown so the caller can retry
 * rather than sign the user out. Rehydrates the in-memory session on success.
 */
export async function currentUsername(): Promise<string | null> {
  const stored = await loadStoredSession();
  if (!stored) return null;
  const user = await validateToken({ token: stored.token, userId: stored.userId });
  if (!user) {
    await clearStoredSession();
    setSession(null);
    return null;
  }
  setSession({ token: stored.token, userId: stored.userId });
  return stored.username;
}

/** Sign in with a Jellyfin account; persists the session + primes the store. */
export async function signIn(username: string, password: string): Promise<void> {
  const session = await authenticateByName(username, password);
  setSession(session);
  await storeSession({ ...session, username });
}

/** Clear the session everywhere (memory + durable store). */
export async function signOut(): Promise<void> {
  setSession(null);
  await clearStoredSession();
}
