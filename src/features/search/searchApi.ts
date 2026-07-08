import { useQuery } from '@tanstack/react-query';
import { searchSource } from './searchSource';
import { groupResults } from './searchGroups';

/** Runs a search (via the active source) and returns grouped results. Disabled
 * for a blank query so an empty box shows the idle state, not a fetch. */
export function useSearchResults(query: string) {
  const trimmed = query.trim();
  const q = useQuery({
    queryKey: ['search', trimmed],
    queryFn: () => searchSource(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 30_000,
  });
  return {
    groups: groupResults(q.data ?? []),
    isLoading: q.isLoading && trimmed.length > 0,
    isFetching: q.isFetching,
    isError: q.isError,
    refetch: q.refetch,
  };
}
