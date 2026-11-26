import { usePluginConfigHydrated } from '../../lib/pluginConfigHydration';
import { storytellerEnabled } from '../../lib/runtimeConfig';

/** storytellerEnabled(), re-read when the plugin config (/Cadence/Config)
 * settles. A screen can mount before that fetch returns — the Books list does
 * on a cold start — and the plain flag read would stay false for its lifetime. */
export function useStorytellerEnabled(): boolean {
  usePluginConfigHydrated();
  return storytellerEnabled();
}
