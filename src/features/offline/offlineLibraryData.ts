import { groupBooks, type Book } from '../audiobook/groupBooks';
import { toAlbums, toArtists, toPlaylists, type OfflineGroup } from './offlineGroups';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { OfflinePlaylist } from './offlinePlaylistStore';

export type { OfflineGroup } from './offlineGroups';

/** Everything the iPod-style offline library can browse, derived PURELY from the
 * download index (+ the saved playlist identities) — no server needed. */
export interface OfflineLibrary {
  songs: JellyfinItem[];
  albums: OfflineGroup[];
  artists: OfflineGroup[];
  audiobooks: Book[];
  playlists: OfflineGroup[];
}

/**
 * Build the whole offline library from the downloaded index. Music tracks
 * (Type: Audio) drive the songs/albums/artists views; AudioBook items reuse the
 * shared groupBooks grouping; saved playlist identities pick out playlist groups.
 */
export function buildOfflineLibrary(
  index: JellyfinItem[],
  playlists: OfflinePlaylist[],
): OfflineLibrary {
  const books = index.filter((t) => t.Type === 'AudioBook');
  const music = index.filter((t) => t.Type !== 'AudioBook');
  return {
    songs: music,
    albums: toAlbums(music),
    artists: toArtists(music),
    audiobooks: groupBooks(books),
    playlists: toPlaylists(music, playlists),
  };
}
