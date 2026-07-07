/**
 * Resolve the auth session with retries for TRANSIENT failures. authClient's
 * currentUsername returns null only on a CONFIRMED no-session; a transient error
 * (cold-start network / token-storage hiccup, or an OFFLINE launch) throws,
 * which we retry with a short backoff. If it stays undetermined after the
 * retries we return 'loading' rather than 'unauthenticated' — so a flaky read
 * (or airplane mode) never signs a user out; the next refresh can recover.
 */
import { currentUsername } from './authClient';
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
      const username = await currentUsername();
      return { status: username ? 'authenticated' : 'unauthenticated', username };
    } catch {
      if (attempt < retries) await delay(attempt);
    }
  }
  return { status: 'loading', username: null };
}
