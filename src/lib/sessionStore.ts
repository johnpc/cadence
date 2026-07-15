/**
 * Module-scoped auth session, set by AuthProvider on sign-in/refresh and read by
 * jellyfinFetch + the stream URL builders. Keeping it here (not threaded through
 * every xApi call) lets `xApi.ts` signatures stay credential-free — mirrors how
 * stoop never passes creds around.
 */
import type { Session } from './jellyfinTypes';

let session: Session | null = null;
const listeners = new Set<() => void>();

export function setSession(next: Session | null): void {
  session = next;
  listeners.forEach((l) => l());
}

export function getSession(): Session | null {
  return session;
}

/** Subscribe to session changes. Used by the player to (re)build stream URLs once
 * the session is restored at launch — a track restored before the session was
 * ready would otherwise get a UserId=&api_key= URL that fails to load (code 4).
 * Returns an unsubscribe. */
export function onSessionChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
