import { useQuery } from '@tanstack/react-query';
import { getItem } from '../../lib/jellyfinItems';
import { getRecentPlays } from '../library/recentPlays';
import { topRecentIds } from './jumpBackIn';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Hydrate the most-recently-played collections (albums/playlists/artists the
 * user played) into cards for a Spotify-style "Jump back in" shelf. Ids come
 * from the local recent-plays store; each is resolved via getItem, and any that
 * fail (a deleted/moved item) are dropped so a stale id can't break the shelf.
 * The query key includes the id list so it refreshes as you play more. */
export function useJumpBackIn() {
  const ids = topRecentIds(getRecentPlays());
  const q = useQuery({
    queryKey: ['jump-back-in', ids],
    queryFn: async (): Promise<JellyfinItem[]> => {
      const items = await Promise.all(ids.map((id) => getItem(id).catch(() => null)));
      return items.filter((i): i is JellyfinItem => i !== null);
    },
    enabled: ids.length > 0,
    staleTime: 60_000,
  });
  return { items: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}
