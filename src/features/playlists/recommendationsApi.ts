import { useQuery } from '@tanstack/react-query';
import { getInstantMix } from '../../lib/jellyfinItems';

/** A pool of candidate tracks to recommend for a playlist, from Jellyfin's
 * instant-mix radio seeded on the playlist itself. Fetched a bit larger than the
 * visible window so dismissals can reveal fresh picks without a refetch. Only
 * enabled once the playlist has ≥1 track to seed from AND the section is in view.
 * Limit kept small: InstantMix latency scales steeply with it (~10s@20 vs ~30s+
 * @50), and 20 candidates are plenty for the list. */
export function usePlaylistRecommendations(playlistId: string, enabled: boolean) {
  const q = useQuery({
    queryKey: ['playlist-recs', playlistId],
    queryFn: () => getInstantMix(playlistId, 20),
    staleTime: 5 * 60_000,
    enabled: enabled && !!playlistId,
  });
  return { candidates: q.data ?? [], isLoading: q.isLoading, isError: q.isError };
}
