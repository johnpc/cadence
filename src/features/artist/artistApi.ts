import { useQuery } from '@tanstack/react-query';
import { getItem, getInstantMix } from '../../lib/jellyfinItems';
import { getArtistAlbums, getArtistTopTracks, getArtistsByIds } from '../../lib/jellyfinArtists';
import { rankRelatedArtistIds } from './rankRelated';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The artist's header metadata (name, image). */
export function useArtist(artistId: string) {
  const q = useQuery({
    queryKey: ['artist', artistId],
    queryFn: () => getItem(artistId),
    staleTime: 60_000,
  });
  return { artist: q.data ?? null, isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** The artist's albums. */
export function useArtistAlbums(artistId: string) {
  const q = useQuery({
    queryKey: ['artist-albums', artistId],
    queryFn: () => getArtistAlbums(artistId),
    staleTime: 60_000,
  });
  return { albums: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** The artist's most-played tracks ("Popular"). */
export function useArtistTopTracks(artistId: string) {
  const q = useQuery({
    queryKey: ['artist-top', artistId],
    queryFn: () => getArtistTopTracks(artistId, 5),
    staleTime: 60_000,
  });
  return { tracks: q.data ?? [] };
}

/** "Fans also like" — artists that recur across this artist's instant-mix radio,
 * ranked by co-occurrence then hydrated to cards. The Jellyfin /Similar endpoint
 * is polluted with playlist entries on this server, so we derive from the mix. */
async function relatedArtists(artistId: string): Promise<JellyfinItem[]> {
  const mix = await getInstantMix(artistId, 60);
  return getArtistsByIds(rankRelatedArtistIds(mix, artistId));
}

export function useRelatedArtists(artistId: string) {
  const q = useQuery({
    queryKey: ['artist-related', artistId],
    queryFn: () => relatedArtists(artistId),
    staleTime: 5 * 60_000,
  });
  return { related: q.data ?? [] };
}
