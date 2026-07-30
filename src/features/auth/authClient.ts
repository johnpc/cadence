/**
 * Thin wrapper over the Jellyfin auth endpoints + durable session storage.
 * Isolates all session side-effects so AuthProvider stays declarative and tests
 * mock a single module. Mirrors stoop's authClient shape.
 */
import { authenticateByName, validateToken } from '../../lib/jellyfinAuth';
import { setSession } from '../../lib/sessionStore';
import { clearStoredSession, loadStoredSession, storeSession } from '../../lib/sessionPersistence';
import { notifySessionExpired } from '../../lib/sessionExpiry';
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
  const trust = (isAdmin = stored.isAdmin) => {
    setSession({ token: stored.token, userId: stored.userId, isAdmin });
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
  // Re-read admin status from the freshly-validated user (it may have changed
  // since sign-in) and re-persist so a later offline launch trusts the right flag.
  const isAdmin = user.Policy?.IsAdministrator === true;
  await storeSession({ ...stored, isAdmin });
  return trust(isAdmin);
}

/**
 * OPTIMISTIC launch: if a session is stored, prime it and return the username
 * IMMEDIATELY — no network wait — so a returning user's shell (and its disk-
 * cached Home/Library data) paints at once instead of staring at the loading
 * splash for a 2–15s token-validation round-trip over the tunnel. The token is
 * validated in the BACKGROUND; a confirmed 401 clears the session and fires the
 * expiry signal (AuthProvider's onSessionExpired handler → re-validate → bounce
 * to sign-in), so a truly-dead token is still caught within moments — the user
 * just isn't blocked on it up front. No stored session → null (show sign-in),
 * same as before. Forced-offline skips the background validate entirely.
 */
export async function currentUsernameOptimistic(): Promise<string | null> {
  const stored = await loadStoredSession();
  if (!stored) return null;
  setSession({ token: stored.token, userId: stored.userId });
  if (!readForceOffline()) {
    // Fire-and-forget: only a CONFIRMED bad token (null = 401) signs out; a
    // transient/offline error is swallowed (the token stays trusted, like the
    // airplane-mode launch path).
    void validateToken({ token: stored.token, userId: stored.userId })
      .then(async (user) => {
        if (user === null) {
          await clearStoredSession();
          setSession(null);
          notifySessionExpired();
        }
      })
      .catch(() => undefined);
  }
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
