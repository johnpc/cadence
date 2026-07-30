/**
 * Resolve the auth session OPTIMISTICALLY with retries for TRANSIENT failures.
 * currentUsernameOptimistic returns the stored username IMMEDIATELY (no network
 * wait) when a session exists — validating the token in the background — so a
 * returning user's shell + disk-cached data paint at once instead of blocking on
 * the loading splash for a slow-tunnel token check. It returns null only on a
 * CONFIRMED no-session (nothing stored); a token-storage hiccup throws, which we
 * retry with a short backoff. If it stays undetermined after the retries we
 * return 'loading' rather than 'unauthenticated' — so a flaky storage read never
 * signs a user out; the next refresh can recover. A dead token is caught by the
 * background validate → onSessionExpired → sign-out, not by blocking launch.
 */
import { currentUsernameOptimistic } from './authClient';
import type { AuthState } from './types';

const RETRIES = 3;
const backoff = (attempt: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, 150 * attempt));

export async function resolveSession(
  retries: number = RETRIES,
  delay: (attempt: number) => Promise<void> = backoff,
): Promise<AuthState> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const username = await currentUsernameOptimistic();
      return { status: username ? 'authenticated' : 'unauthenticated', username };
    } catch {
      if (attempt < retries) await delay(attempt);
    }
  }
  return { status: 'loading', username: null };
}
