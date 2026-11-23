import { useEffect } from 'react';
import { isExtensionEnabled } from '../../extensions/flags';
import { usePluginConfigHydrated } from '../../lib/pluginConfigHydration';
import { createStoredValue, useStore } from '../../lib/store';

/**
 * Whether the bottom tab bar shows "Requests" — decided ONCE per session.
 *
 * The flag only becomes known when the server's plugin config arrives, a moment
 * after the shell first renders, and the tab bar used to read it on every render:
 * Home showed four tabs, Search five, and the tabs resized under the listener's
 * thumb. Now the first settled answer is latched for the rest of the session,
 * and remembered so the next launch starts with the right count straight away.
 */
export type RequestsTab = 'shown' | 'hidden';

const lastKnown = createStoredValue<RequestsTab>({
  key: 'cadence.shell.requestsTab',
  parse: (raw) => (raw === 'shown' ? 'shown' : 'hidden'),
  serialize: (value) => value,
});

let session: RequestsTab | null = null;

/** What to show now: the session's latched answer, else the last launch's. */
export function requestsTab(latched: RequestsTab | null, remembered: RequestsTab): RequestsTab {
  return latched ?? remembered;
}

/** Latch the answer once the plugin config has settled (idempotent). */
export function latchRequestsTab(hydrated: boolean, enabled: () => boolean): RequestsTab | null {
  if (hydrated && session === null) session = enabled() ? 'shown' : 'hidden';
  return session;
}

/** Tests only: forget the session latch. */
export function resetRequestsTabSession(): void {
  session = null;
}

export function useRequestsTab(): boolean {
  const hydrated = usePluginConfigHydrated();
  const remembered = useStore(lastKnown);
  const latched = latchRequestsTab(hydrated, () => isExtensionEnabled('requests'));
  useEffect(() => {
    if (latched && latched !== lastKnown.get()) lastKnown.set(latched);
  }, [latched]);
  return requestsTab(latched, remembered) === 'shown';
}
