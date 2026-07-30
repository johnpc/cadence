/**
 * Thin wrapper over the Jellyfin auth endpoints + durable session storage.
 * Isolates all session side-effects so AuthProvider stays declarative and tests
 * mock a single module. Mirrors stoop's authClient shape.
 */
import { authenticateByName, validateToken } from '../../lib/jellyfinAuth';
import { setSession } from '../../lib/sessionStore';
import { clearStoredSession, loadStoredSession, storeSession } from '../../lib/sessionPersistence';
import { readForceOffline } from '../settings/forceOfflineStore';

/**
 * The signed-in user's username, or null on a CONFIRMED no-session (no stored
 * session, or a 401 = dead token). Rehydrates the in-memory session on success.
 *
 * Offline-first: with a stored session we TRUST it and resolve immediately when
 * the server can't be reached — either forced offline mode, or a genuine
 * airplane-mode launch where validateToken throws a network error. Otherwise a
 * fresh offline launch strands the app on the loading splash forever (no
 * network to validate, no way to reach offline mode). A truly-dead token is
 * still caught once back online: the next authed request 401s → sign-out.
 */
export async function currentUsername(): Promise<string | null> {
  const stored = await loadStoredSession();
  if (!stored) return null;
  const trust = () => {
    setSession({ token: stored.token, userId: stored.userId });
    return stored.username;
  };
  if (readForceOffline()) return trust();
  let user;
  try {
    user = await validateToken({ token: stored.token, userId: stored.userId });
  } catch {
    // Server unreachable (offline / network error) — trust the stored session
    // so launch completes and the offline library is reachable.
    return trust();
  }
  if (!user) {
    await clearStoredSession();
    setSession(null);
    return null;
  }
  return trust();
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
