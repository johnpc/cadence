/**
 * Module-scoped auth session, set by AuthProvider on sign-in/refresh and read by
 * jellyfinFetch + the stream URL builders. Keeping it here (not threaded through
 * every xApi call) lets `xApi.ts` signatures stay credential-free — mirrors how
 * stoop never passes creds around.
 */
import type { Session } from './jellyfinTypes';

let session: Session | null = null;

export function setSession(next: Session | null): void {
  session = next;
}

export function getSession(): Session | null {
  return session;
}
