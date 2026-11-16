/**
 * Module-scoped auth session, set by AuthProvider on sign-in/refresh and read by
 * jellyfinFetch + the stream URL builders. Keeping it here (not threaded through
 * every xApi call) lets `xApi.ts` signatures stay credential-free. The player
 * engine subscribes to it: it defers loading until a session lands at launch,
 * and stops playback when the session is cleared (sign-out / a dead token).
 */
import { createStore } from './store';
import type { Session } from './jellyfinTypes';

export const sessionStore = createStore<Session | null>(null);

export const setSession = (next: Session | null): void => sessionStore.set(next);
export const getSession = (): Session | null => sessionStore.get();
/** Subscribe to session changes; returns an unsubscribe. */
export const onSessionChange = (listener: () => void): (() => void) =>
  sessionStore.subscribe(listener);
