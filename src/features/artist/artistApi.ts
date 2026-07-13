import { useQuery } from '@tanstack/react-query';
import { getItem, getInstantMix } from '../../lib/jellyfinItems';
import {
  getArtistAlbums,
  getArtistTopTracks,
  getArtistTracks,
  getArtistsByIds,
} from '../../lib/jellyfinArtists';
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

/** All of an artist's tracks (A–Z) for the "See all" page. */
export function useArtistTracks(artistId: string) {
  const q = useQuery({
    queryKey: ['artist-tracks', artistId],
    queryFn: () => getArtistTracks(artistId),
    staleTime: 60_000,
  });
  return { tracks: q.data ?? [], isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** "Fans also like" — artists that recur across this artist's instant-mix radio,
 * ranked by co-occurrence then hydrated to cards. The Jellyfin /Similar endpoint
 * is polluted with playlist entries on this server, so we derive from the mix. */
async function relatedArtists(artistId: string): Promise<JellyfinItem[]> {
  // Small mix: InstantMix latency scales steeply with Limit (live-measured
  // ~9s@10 vs ~21-37s@60), and 20 tracks yield plenty of distinct artists to
  // rank. Same trade as the album similar-albums fetch.
  const mix = await getInstantMix(artistId, 20);
  return getArtistsByIds(rankRelatedArtistIds(mix, artistId));
}

/** Related artists ("Fans also like"). `enabled` lets the caller defer this slow
 * (InstantMix-backed) below-the-fold query until it scrolls into view, so it
 * doesn't block the artist page's albums/popular tracks on mount. */
export function useRelatedArtists(artistId: string, enabled = true) {
  const q = useQuery({
    queryKey: ['artist-related', artistId],
    queryFn: () => relatedArtists(artistId),
    enabled,
    staleTime: 5 * 60_000,
  });
  return { related: q.data ?? [] };
}
