import { useQuery } from '@tanstack/react-query';
import { getItem, getItemTracks } from '../../lib/jellyfinItems';
import { getArtistAlbums } from '../../lib/jellyfinArtists';

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
