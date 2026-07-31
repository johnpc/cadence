import { useQuery } from '@tanstack/react-query';
import { fetchHomeShelves, homeSourceEnabled, type HomeShelvesData } from './homeSource';

/** The precomputed Home shelves from the plugin, or null when the fast path is
 * off (no plugin) or the single call is still loading / errored — in which case
 * useHomeShelves falls back to the native per-shelf queries. `active` reflects
 * whether the plugin path is even enabled, so callers can gate their native
 * queries (exactly one source fetches). */
export function useHomeSource(): {
  active: boolean;
  data: HomeShelvesData | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
} {
  const active = homeSourceEnabled();
  const q = useQuery({
    queryKey: ['home', 'plugin-shelves'],
    queryFn: fetchHomeShelves,
    enabled: active,
    staleTime: 60_000,
  });
  return {
    active,
    // Only surface data on the fast path; a failed call yields null so callers
    // fall back to native (isError drives that decision).
    data: active && !q.isError ? (q.data ?? null) : null,
    isLoading: active && q.isLoading,
    isError: active && q.isError,
    refetch: () => void q.refetch(),
  };
}
