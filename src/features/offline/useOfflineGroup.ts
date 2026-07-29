import { useOfflineLibrary } from './useOfflineLibrary';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Look up one offline group's tracks by kind + id, from the local library.
 * `album`/`artist`/`playlist` resolve to their grouped tracks; `audiobook`
 * resolves to a book's parts. Returns null when not found (e.g. the download was
 * removed) so the page can show an empty state instead of crashing. */
export function useOfflineGroup(
  kind: string,
  id: string,
): { title: string; tracks: JellyfinItem[] } | null {
  const lib = useOfflineLibrary();
  if (kind === 'audiobook') {
    const book = lib.audiobooks.find((b) => b.id === id);
    return book ? { title: book.title, tracks: book.parts } : null;
  }
  const source = kind === 'artist' ? lib.artists : kind === 'playlist' ? lib.playlists : lib.albums;
  const group = source.find((g) => g.id === id);
  return group ? { title: group.title, tracks: group.tracks } : null;
}
