import { useQuery } from '@tanstack/react-query';
import { usePluginConfigHydrated } from '../../lib/pluginConfigStore';
import { fetchAudiobookLibrary, audiobookSourceEnabled } from './audiobookSource';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The precomputed audiobook library from the plugin. `active` = the plugin path
 * owns the library (so useAudiobookLibrary must NOT fire the native scan): true
 * while the plugin config is still hydrating (we don't yet know if the plugin
 * exists — assume it might, to avoid racing the slow native scan against it), and
 * true once hydrated iff the audiobooks flag is set. Only when hydration has
 * SETTLED and the flag is off (or the /Cadence/Audiobooks call errors, incl. the
 * 503 cold miss) does `active` go false / `isError` go true, letting the caller
 * fall back to the native scan. Mirrors useHomeSource — closes the mount-time race
 * where the flag isn't set yet (populated by the async /Cadence/Config fetch). */
export function useAudiobookSource(): {
  active: boolean;
  data: JellyfinItem[] | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const hydrated = usePluginConfigHydrated();
  const enabledByFlag = hydrated && audiobookSourceEnabled();
  // Before hydration settles, keep the path "active" so the native scan stays off.
  const active = !hydrated || enabledByFlag;
  const q = useQuery({
    queryKey: ['audiobooks', 'plugin-library'],
    queryFn: fetchAudiobookLibrary,
    enabled: enabledByFlag, // only fetch once we KNOW the plugin serves this
    staleTime: 60_000,
  });
  return {
    active,
    // Data only on the confirmed fast path; a failed call yields null so the
    // caller falls back to the native scan (isError drives that decision).
    data: enabledByFlag && !q.isError ? (q.data ?? null) : null,
    // "Loading" while hydration hasn't settled OR the enabled query is fetching.
    isLoading: !hydrated || (enabledByFlag && q.isLoading),
    isError: enabledByFlag && q.isError,
    refetch: () => void q.refetch(),
  };
}
