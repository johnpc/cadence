import { useQuery } from '@tanstack/react-query';
import { usePluginConfigHydrated } from '../../lib/pluginConfigStore';
import { fetchHomeShelves, homeSourceEnabled, type HomeShelvesData } from './homeSource';

/** The precomputed Home shelves from the plugin. `active` = the plugin path owns
 * Home (so useHomeShelves must NOT fire native queries): true while the plugin
 * config is still hydrating (we don't yet know if the plugin exists — assume it
 * might, to avoid racing native scans against it), and true once hydrated iff the
 * homeShelves flag is set. Only when hydration has SETTLED and the flag is off
 * (or the /Cadence/Home call errors) does `active` go false / `isError` go true,
 * letting the caller fall back to native. This closes the mount-time race where
 * the flag isn't set yet (it's populated by the async /Cadence/Config fetch). */
export function useHomeSource(): {
  active: boolean;
  data: HomeShelvesData | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const hydrated = usePluginConfigHydrated();
  const enabledByFlag = hydrated && homeSourceEnabled();
  // Before hydration settles, keep the path "active" so native stays off.
  const active = !hydrated || enabledByFlag;
  const q = useQuery({
    queryKey: ['home', 'plugin-shelves'],
    queryFn: fetchHomeShelves,
    enabled: enabledByFlag, // only fetch once we KNOW the plugin serves this
    staleTime: 60_000,
  });
  return {
    active,
    // Data only on the confirmed fast path; a failed call yields null so callers
    // fall back to native (isError drives that decision).
    data: enabledByFlag && !q.isError ? (q.data ?? null) : null,
    // "Loading" while hydration hasn't settled OR the enabled query is fetching.
    isLoading: !hydrated || (enabledByFlag && q.isLoading),
    isError: enabledByFlag && q.isError,
    refetch: () => void q.refetch(),
  };
}
