import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchSource } from './searchSource';
import { groupResults } from './searchGroups';

/** Runs a search (via the active source) and returns grouped results. Disabled
 * for a blank query so an empty box shows the idle state, not a fetch.
 *
 * `keepPreviousData`: as the user types, each debounced term is a NEW query key.
 * Without this, `data` is undefined for the new key until it resolves — so the
 * results blank out AND the "no results" empty state flashes on every keystroke
 * group (isEmptyGroups sees []). Keeping the previous term's results on screen
 * (dimmable via isFetching) until the new ones land removes that flicker; the
 * search-as-you-type feels continuous instead of strobing. */
export function useSearchResults(query: string) {
  const trimmed = query.trim();
  const q = useQuery({
    queryKey: ['search', trimmed],
    queryFn: () => searchSource(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
  return {
    groups: groupResults(q.data ?? []),
    isLoading: q.isLoading && trimmed.length > 0,
    isFetching: q.isFetching,
    isError: q.isError,
    refetch: q.refetch,
  };
}
