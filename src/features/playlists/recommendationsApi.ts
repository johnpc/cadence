import { useQuery } from '@tanstack/react-query';
import { getSimilarSongs } from '../../lib/navidromeItems';

/** A pool of candidate tracks to recommend for a playlist, from a similar-
 * songs radio seeded on one of the playlist's OWN tracks (Subsonic's
 * getSimilarSongs2 seeds by song/album/artist, not a playlist id — unlike
 * Jellyfin's InstantMix, which could seed directly off the playlist). Fetched
 * a bit larger than the visible window so dismissals can reveal fresh picks
 * without a refetch. Only enabled once there's a track to seed from AND the
 * section is in view. Limit kept small: this call was historically slow at
 * scale, and 20 candidates are plenty for the list. */
export function usePlaylistRecommendations(seedTrackId: string | undefined, enabled: boolean) {
  const q = useQuery({
    queryKey: ['playlist-recs', seedTrackId],
    queryFn: () => getSimilarSongs(seedTrackId as string, 20),
    staleTime: 5 * 60_000,
    enabled: enabled && !!seedTrackId,
  });
  return { candidates: q.data ?? [], isLoading: q.isLoading, isError: q.isError };
}
