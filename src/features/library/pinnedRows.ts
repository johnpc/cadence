import type { LibraryRow } from './libraryRows';

/** Count → "N song(s)" subtitle helper. */
function songs(n: number): string {
  return `${n} ${n === 1 ? 'song' : 'songs'}`;
}

/**
 * The synthetic playlists pinned to the top of the library's Playlists filter:
 * Liked Songs (Jellyfin favorites) and Downloads (offline tracks). Both are
 * pseudo-playlists — not real Jellyfin playlists — so they're built here rather
 * than coming from the server. Downloads is pinned only when non-empty so a
 * user who never downloads doesn't see an empty shortcut.
 */
export function pinnedRows(likedCount: number, downloadsCount: number): LibraryRow[] {
  const liked: LibraryRow = {
    id: 'liked-songs',
    name: 'Liked Songs',
    subtitle: `Playlist • ${songs(likedCount)}`,
    to: '/liked',
    round: false,
    item: null,
    liked: true,
    pinned: true,
  };
  if (downloadsCount === 0) return [liked];
  const downloads: LibraryRow = {
    id: 'downloads',
    name: 'Downloads',
    subtitle: `Playlist • ${songs(downloadsCount)}`,
    to: '/downloads',
    round: false,
    item: null,
    pinned: true,
    downloads: true,
  };
  return [liked, downloads];
}
