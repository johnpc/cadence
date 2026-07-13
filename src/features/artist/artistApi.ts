import { useQuery } from '@tanstack/react-query';
import { getItem } from '../../lib/jellyfinItems';
import { getArtistAlbums, getArtistTopTracks, getArtistTracks } from '../../lib/jellyfinArtists';
import { createItemListCache } from '../../lib/itemListCache';
import { getCachedRelatedArtists, fetchAndCacheRelatedArtists } from './relatedArtistsCache';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

export { RELATED_ARTISTS_CACHE_KEY } from './relatedArtistsCache';

/** Disk cache of an artist's albums — changes rarely, so a revisited artist
 * paints its discography instantly (see itemListCache). */
const artistAlbumsCache = createItemListCache('cadence.artist-albums');
export const ARTIST_ALBUMS_CACHE_KEY = artistAlbumsCache.storageKey;

/** Fetch an artist's albums and persist them (query fn + prefetch). */
export function fetchAndCacheArtistAlbums(artistId: string): Promise<JellyfinItem[]> {
  return artistAlbumsCache.fetchAndCache(artistId, getArtistAlbums);
}
export function getCachedArtistAlbums(artistId: string): JellyfinItem[] | undefined {
  return artistAlbumsCache.get(artistId);
}

/** The artist's header metadata (name, image). */
export function useArtist(artistId: string) {
  const q = useQuery({
    queryKey: ['artist', artistId],
    queryFn: () => getItem(artistId),
    staleTime: 60_000,
  });
  return { artist: q.data ?? null, isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** The artist's albums. Seeded from a disk cache so a revisited artist paints
 * its discography instantly, then refetches in the background. */
export function useArtistAlbums(artistId: string) {
  const cached = getCachedArtistAlbums(artistId);
  const q = useQuery({
    queryKey: ['artist-albums', artistId],
    queryFn: () => fetchAndCacheArtistAlbums(artistId),
    staleTime: 5 * 60_000,
    initialData: cached,
    initialDataUpdatedAt: cached ? 0 : undefined,
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

/** All of an artist's tracks (A–Z) for the "See all" page. */
export function useArtistTracks(artistId: string) {
  const q = useQuery({
    queryKey: ['artist-tracks', artistId],
    queryFn: () => getArtistTracks(artistId),
    staleTime: 60_000,
  });
  return { tracks: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** Related artists ("Fans also like"). `enabled` defers this slow InstantMix-
 * backed query until it scrolls into view; seeded from disk so a revisit paints
 * instantly instead of re-waiting on the mix (see relatedArtistsCache). */
export function useRelatedArtists(artistId: string, enabled = true) {
  const cached = getCachedRelatedArtists(artistId);
  const q = useQuery({
    queryKey: ['artist-related', artistId],
    queryFn: () => fetchAndCacheRelatedArtists(artistId),
    enabled,
    staleTime: 5 * 60_000,
    initialData: cached,
    initialDataUpdatedAt: cached ? 0 : undefined,
  });
  return { related: q.data ?? [] };
}
