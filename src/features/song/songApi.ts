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

/** The playlists a song appears in. EXPENSIVE — it lists the user's playlists
 * (ownership fan-out) then fetches up to 40 playlists' full track lists to scan
 * them. `enabled` lets the caller defer it until the below-the-fold "Appears in"
 * section scrolls into view, so it never blocks the song page on mount. */
export function useSongPlaylists(songId: string, enabled = true) {
  const q = useQuery({
    queryKey: ['song-playlists', songId],
    queryFn: () => playlistsContaining(songId),
    enabled,
    staleTime: 60_000,
  });
  return { playlists: q.data ?? [] };
}

/** The full album item a track belongs to — for the rich "From the album" card
 * (art + year + genres). Skipped when the track has no album id. */
export function useSongAlbum(albumId: string | undefined) {
  const q = useQuery({
    queryKey: ['album', albumId],
    queryFn: () => getItem(albumId as string),
    enabled: !!albumId,
    staleTime: 60_000,
  });
  return { album: q.data ?? null };
}

/** The primary artist item for a track — for the "About the artist" card
 * (image + bio snippet). Skipped when the track credits no linkable artist. */
export function useSongArtist(artistId: string | undefined) {
  const q = useQuery({
    queryKey: ['artist', artistId],
    queryFn: () => getItem(artistId as string),
    enabled: !!artistId,
    staleTime: 60_000,
  });
  return { artist: q.data ?? null };
}
