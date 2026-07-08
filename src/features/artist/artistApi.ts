import { useQuery } from '@tanstack/react-query';
import { getItem } from '../../lib/jellyfinItems';
import { getArtistAlbums } from '../../lib/jellyfinArtists';

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
