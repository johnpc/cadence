import { artistLine } from '../player/playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** How the Liked Songs list is ordered. 'recent' (default) keeps Jellyfin's
 * most-recently-added order; 'title'/'artist' sort alphabetically. */
export type LikedSort = 'recent' | 'title' | 'artist';

/** The sort options, in display order, with their labels. */
export const LIKED_SORTS: { value: LikedSort; label: string }[] = [
  { value: 'recent', label: 'Recently added' },
  { value: 'title', label: 'Title' },
  { value: 'artist', label: 'Artist' },
];

const byName = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

/** Sort liked songs by the chosen order. 'recent' returns the server order
 * unchanged (favorites already come newest-first). Pure + stable. */
export function sortLikedSongs(songs: JellyfinItem[], sort: LikedSort): JellyfinItem[] {
  if (sort === 'recent') return songs;
  const keyed = songs.map((s, i) => ({ s, i }));
  keyed.sort((a, b) => {
    const av = sort === 'title' ? (a.s.Name ?? '') : artistLine(a.s);
    const bv = sort === 'title' ? (b.s.Name ?? '') : artistLine(b.s);
    return byName(av, bv) || a.i - b.i;
  });
  return keyed.map((e) => e.s);
}
