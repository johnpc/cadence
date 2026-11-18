import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { searchSource } from './searchSource';
import { groupResults } from './searchGroups';
import { searchDownloads } from './downloadsSearch';
import { readIndex } from '../downloads/downloadIndex';
import { useEffectiveOffline } from '../shell/useEffectiveOffline';

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
  // Offline, search is the downloads on the device (instant, no server) — so a
  // search never dead-ends on "you're offline".
  const offline = useEffectiveOffline();
  const q = useQuery({
    queryKey: ['search', offline ? 'downloads' : 'server', trimmed],
    queryFn: () =>
      offline ? Promise.resolve(searchDownloads(trimmed, readIndex())) : searchSource(trimmed),
    enabled: trimmed.length > 0,
    staleTime: offline ? 0 : 30_000,
    placeholderData: keepPreviousData,
  });
  return {
    offline,
    groups: groupResults(q.data ?? []),
    isLoading: q.isLoading && trimmed.length > 0,
    isFetching: q.isFetching,
    isError: q.isError,
    refetch: q.refetch,
  };
}
