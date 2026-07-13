import { useQuery } from '@tanstack/react-query';
import { getItem, getItemTracks, getInstantMix, getItemsByIds } from '../../lib/jellyfinItems';
import { getArtistAlbums } from '../../lib/jellyfinArtists';
import { rankSimilarAlbumIds } from './rankSimilar';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The album's header metadata (name, artist, art). */
export function useAlbum(albumId: string) {
  const q = useQuery({
    queryKey: ['album', albumId],
    queryFn: () => getItem(albumId),
    staleTime: 60_000,
  });
  return { album: q.data ?? null, isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** The album's tracks, in track order. */
export function useAlbumTracks(albumId: string) {
  const q = useQuery({
    queryKey: ['album-tracks', albumId],
    queryFn: () => getItemTracks(albumId),
    staleTime: 60_000,
  });
  return { tracks: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** Other albums by the same artist (excluding `excludeId`) for "More by …".
 * `enabled` lets the caller defer this below-the-fold query until it scrolls
 * into view, so it doesn't contend with the album's own tracklist on mount. */
export function useMoreByArtist(artistId: string | undefined, excludeId: string, enabled = true) {
  const q = useQuery({
    queryKey: ['artist-albums', artistId],
    queryFn: () => getArtistAlbums(artistId as string),
    enabled: !!artistId && enabled,
    staleTime: 60_000,
  });
  return { albums: (q.data ?? []).filter((a) => a.Id !== excludeId) };
}

/** Albums whose tracks show up in this album's instant-mix radio — "Fans also
 * like". Empty (section hidden) when the mix is thin or all one album.
 *
 * The mix limit is deliberately small: InstantMix latency scales steeply with
 * Limit (live-measured ~9s at 10, ~10.6s at 20, ~37s at 60!), and 20 tracks
 * already yield plenty of distinct albums to rank an 8-item shelf. So we trade a
 * slightly smaller candidate pool for a ~3.5× faster call. */
async function fetchSimilarAlbums(albumId: string): Promise<JellyfinItem[]> {
  const mix = await getInstantMix(albumId, 20);
  const ids = rankSimilarAlbumIds(mix, albumId);
  return getItemsByIds(ids);
}

export function useSimilarAlbums(albumId: string, enabled = true) {
  const q = useQuery({
    queryKey: ['similar-albums', albumId],
    queryFn: () => fetchSimilarAlbums(albumId),
    staleTime: 60_000,
    // Deferred until the section nears the viewport: InstantMix is the app's
    // slowest call (~13s), and "Fans also like" is below the fold — firing it on
    // mount just contends with the album's own tracklist load.
    enabled,
  });
  return { albums: q.data ?? [] };
}
