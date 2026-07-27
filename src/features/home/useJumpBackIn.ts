import { useSyncExternalStore } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAlbum } from '../../lib/navidromeItems';
import { getArtist } from '../../lib/navidromeArtists';
import { getPlaylist } from '../../lib/navidromePlaylists';
import { getRecentPlays, subscribeRecentPlays } from '../library/recentPlays';
import { topRecentIds } from './jumpBackIn';
import type { MediaItem } from '../../lib/navidromeTypes';

/** Recent-plays only stores a bare id (no kind) — Subsonic has no "any entity"
 * lookup, so try each kind a recent play can be (album/artist/playlist) in
 * turn. A genuine failure on the last kind propagates, letting the caller's
 * per-id catch drop it (a stale/deleted id must not break the shelf). */
async function getCollectionById(id: string): Promise<MediaItem> {
  try {
    return await getAlbum(id);
  } catch {
    /* not an album */
  }
  try {
    return await getArtist(id);
  } catch {
    /* not an artist */
  }
  return getPlaylist(id);
}

/** Hydrate the most-recently-played collections (albums/playlists/artists the
 * user played) into cards for a Spotify-style "Jump back in" shelf. Ids come
 * from the local recent-plays store (subscribed, so the shelf updates live when
 * you play something — no reload); any that fail (a deleted/moved item) are
 * dropped so a stale id can't break the shelf. The query key includes the id
 * list so it refreshes as you play more. */
export function useJumpBackIn() {
  const idsKey = useSyncExternalStore(subscribeRecentPlays, () =>
    topRecentIds(getRecentPlays()).join(','),
  );
  const ids = idsKey ? idsKey.split(',') : [];
  const q = useQuery({
    queryKey: ['jump-back-in', ids],
    queryFn: async (): Promise<MediaItem[]> => {
      const items = await Promise.all(ids.map((id) => getCollectionById(id).catch(() => null)));
      return items.filter((i): i is MediaItem => i !== null);
    },
    enabled: ids.length > 0,
    staleTime: 60_000,
  });
  return { items: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}
