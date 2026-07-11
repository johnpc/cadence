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

/** Other albums by the same artist (excluding `excludeId`) for "More by …". */
export function useMoreByArtist(artistId: string | undefined, excludeId: string) {
  const q = useQuery({
    queryKey: ['artist-albums', artistId],
    queryFn: () => getArtistAlbums(artistId as string),
    enabled: !!artistId,
    staleTime: 60_000,
  });
  return { albums: (q.data ?? []).filter((a) => a.Id !== excludeId) };
}

/** Albums whose tracks show up in this album's instant-mix radio — "Fans also
 * like". Empty (section hidden) when the mix is thin or all one album. */
async function fetchSimilarAlbums(albumId: string): Promise<JellyfinItem[]> {
  const mix = await getInstantMix(albumId, 60);
  const ids = rankSimilarAlbumIds(mix, albumId);
  return getItemsByIds(ids);
}

export function useSimilarAlbums(albumId: string) {
  const q = useQuery({
    queryKey: ['similar-albums', albumId],
    queryFn: () => fetchSimilarAlbums(albumId),
    staleTime: 60_000,
  });
  return { albums: q.data ?? [] };
}
