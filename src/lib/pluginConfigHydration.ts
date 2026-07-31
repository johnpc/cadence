/**
 * A tiny reactive signal for whether the plugin-config fetch (hydratePluginConfig
 * in pluginConfigStore) has settled — success OR failure. Consumers that branch
 * on a plugin flag (e.g. homeShelves, audiobooks) must WAIT for this before
 * treating a flag as absent: the flag is only set once the async /Cadence/Config
 * fetch resolves, so reading it at mount would wrongly see the plugin as
 * unavailable and, e.g., fire the native queries the fast paths exist to avoid.
 */
import { useSyncExternalStore } from 'react';

let configHydrated = false;
const hydrationListeners = new Set<() => void>();

/** True once the plugin config fetch has settled (either way). */
export function isPluginConfigHydrated(): boolean {
  return configHydrated;
}

/** React hook: re-renders when plugin-config hydration settles. */
export function usePluginConfigHydrated(): boolean {
  return useSyncExternalStore(
    (cb) => {
      hydrationListeners.add(cb);
      return () => hydrationListeners.delete(cb);
    },
    () => configHydrated,
    () => configHydrated,
  );
}

/** Flip the signal to settled and notify subscribers. Idempotent. Called by
 * hydratePluginConfig in a finally, so even a failed fetch counts as settled. */
export function markConfigHydrated(): void {
  if (configHydrated) return;
  configHydrated = true;
  hydrationListeners.forEach((l) => l());
}
