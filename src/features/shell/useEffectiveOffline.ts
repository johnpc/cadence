import { useReachability } from './useOnlineStatus';
import { useForceOffline } from '../settings/useForceOffline';

/**
 * Whether the app should behave as offline right now — the single signal the
 * offline library and offline affordances read. True when EITHER the user forced
 * offline mode in Settings OR the server is not confirmed reachable (`offline` —
 * NOT the launch `pending` window, so a cold start doesn't force the offline
 * library before the first request has had a chance to land).
 */
export function useEffectiveOffline(): boolean {
  const reachability = useReachability();
  const { forceOffline } = useForceOffline();
  return forceOffline || reachability === 'offline';
}
