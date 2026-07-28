import { useSyncExternalStore } from 'react';
import {
  getReachability,
  onReachabilityChange,
  type Reachability,
} from '../../lib/reachabilityStore';

/**
 * Server reachability, offline-FIRST. Reads the reachability store, which starts
 * `pending` (not yet confirmed online) at launch and flips to `online` only once
 * a real Jellyfin request succeeds — so offline affordances work immediately on
 * a cold launch instead of waiting on an optimistic `navigator.onLine`. iOS is
 * why: a WKWebView reports `onLine: true` on a dead link, so we can't trust it.
 */
export function useReachability(): Reachability {
  return useSyncExternalStore(onReachabilityChange, getReachability, () => 'pending' as const);
}

/** Convenience boolean: true only when the server is CONFIRMED reachable. Both
 * `pending` (launch, before the first request lands) and `offline` read as not-
 * online — honouring the offline-first default. */
export function useOnlineStatus(): boolean {
  return useReachability() === 'online';
}
