/**
 * A tiny pub/sub so the low-level fetch layer can tell the auth layer "the
 * server just rejected our token (auth error code 40)" without importing React
 * or AuthProvider (which would be a circular dependency). navidromeFetch calls
 * `notifySessionExpired()` on every bad-credentials response; AuthProvider
 * subscribes and re-validates the session — recovering if it was transient, or
 * signing out if the token is truly dead. Covers ALL such failures (react-query
 * reads/writes AND raw `<audio>`/`<img>` stream loads), which a react-query-only
 * handler would miss.
 */
type Listener = () => void;

const listeners = new Set<Listener>();

/** Subscribe to 401s. Returns an unsubscribe fn. */
export function onSessionExpired(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Notify subscribers that the server rejected the current token. Fire-and-
 * forget from the fetch layer. */
export function notifySessionExpired(): void {
  for (const l of listeners) l();
}
