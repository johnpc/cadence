/**
 * A tiny reactive signal for whether the plugin-config fetch (hydratePluginConfig
 * in pluginConfigStore) has settled — success OR failure. Consumers that branch
 * on a plugin flag (e.g. homeShelves, audiobooks) must WAIT for this before
 * treating a flag as absent: the flag is only set once the async /Cadence/Config
 * fetch resolves, so reading it at mount would wrongly see the plugin as
 * unavailable and, e.g., fire the native queries the fast paths exist to avoid.
 */
import { createStore, useStore } from './store';

const hydrated = createStore(false);

/** True once the plugin config fetch has settled (either way). */
export const isPluginConfigHydrated = (): boolean => hydrated.get();

/** React hook: re-renders when plugin-config hydration settles. */
export const usePluginConfigHydrated = (): boolean => useStore(hydrated);

/** Flip the signal to settled and notify subscribers. Idempotent. Called by
 * hydratePluginConfig in a finally, so even a failed fetch counts as settled. */
export const markConfigHydrated = (): void => hydrated.set(true);
