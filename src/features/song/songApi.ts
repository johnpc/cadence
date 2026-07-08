import { useQuery } from '@tanstack/react-query';
import { getItem } from '../../lib/jellyfinItems';
import { getPlaylists, getPlaylistItems } from '../../lib/jellyfinPlaylists';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** A single track's metadata (name, artists, album). */
export function useSong(songId: string) {
  const q = useQuery({
    queryKey: ['song', songId],
    queryFn: () => getItem(songId),
    staleTime: 60_000,
  });
  return { song: q.data ?? null, isLoading: q.isLoading, isError: q.isError, refetch: q.refetch };
}

/** The playlists that contain a track. Jellyfin has no reverse index, so we
 * scan the user's playlists (capped) and keep the ones whose items include it.
 * Bounded + cached so the song page stays responsive. */
async function playlistsContaining(songId: string): Promise<JellyfinItem[]> {
  const playlists = (await getPlaylists()).slice(0, 40);
  const checks = await Promise.all(
    playlists.map(async (pl) => {
      const entries = await getPlaylistItems(pl.Id).catch(() => [] as JellyfinItem[]);
      return entries.some((t) => t.Id === songId) ? pl : null;
    }),
  );
  return checks.filter((p): p is JellyfinItem => p !== null);
}

/** The playlists a song appears in (lazy; scans playlist contents). */
export function useSongPlaylists(songId: string) {
  const q = useQuery({
    queryKey: ['song-playlists', songId],
    queryFn: () => playlistsContaining(songId),
    staleTime: 60_000,
  });
  return { playlists: q.data ?? [] };
}
