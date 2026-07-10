import { artistLine } from '../player/playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** How a playlist's tracks are displayed. 'custom' (default) is the user's
 * saved order (drag-reorderable); 'title'/'artist' are display-only sorts. */
export type PlaylistSort = 'custom' | 'title' | 'artist';

export const PLAYLIST_SORTS: { value: PlaylistSort; label: string }[] = [
  { value: 'custom', label: 'Custom order' },
  { value: 'title', label: 'Title' },
  { value: 'artist', label: 'Artist' },
];

const byName = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });

/** Sort tracks for display. 'custom' returns them unchanged (the saved order);
 * 'title'/'artist' sort alphabetically. Pure + stable. Reorder is only offered
 * for 'custom' (sorting a reorderable list is meaningless), enforced by the UI. */
export function sortPlaylistTracks(tracks: JellyfinItem[], sort: PlaylistSort): JellyfinItem[] {
  if (sort === 'custom') return tracks;
  const keyed = tracks.map((t, i) => ({ t, i }));
  keyed.sort((a, b) => {
    const av = sort === 'title' ? (a.t.Name ?? '') : artistLine(a.t);
    const bv = sort === 'title' ? (b.t.Name ?? '') : artistLine(b.t);
    return byName(av, bv) || a.i - b.i;
  });
  return keyed.map((e) => e.t);
}
