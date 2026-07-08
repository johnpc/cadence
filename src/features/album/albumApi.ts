import { useQuery } from '@tanstack/react-query';
import { getItem, getItemTracks } from '../../lib/jellyfinItems';

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
