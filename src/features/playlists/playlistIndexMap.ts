import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Map each track to its index in the FULL playlist, in ONE O(n) pass. Rendering
 * a large playlist previously called `tracks.indexOf(track)` per row — O(n²),
 * the real cause of big playlists feeling slow to render/scroll. Callers look up
 * a row's true playlist position in O(1) instead. */
export function buildPlaylistIndex(tracks: JellyfinItem[]): Map<JellyfinItem, number> {
  const m = new Map<JellyfinItem, number>();
  tracks.forEach((t, i) => m.set(t, i));
  return m;
}

/** The remove-from-playlist handler for a row, or undefined when the row can't
 * be removed (a non-editable/cloned playlist, or a track with no entry id). */
export function removeHandler(
  editable: boolean,
  entryId: string | undefined,
  remove: (entryId: string) => void,
) {
  return editable && entryId ? () => remove(entryId) : undefined;
}

/** The up/down reorder controls for a row at `index` in a playlist of `total`
 * tracks, wired to `onMove(newIndex)`. Returns undefined when the view isn't
 * reorderable (filtered/sorted), so a row shows no reorder arrows. */
export function reorderProps(
  reorderable: boolean,
  index: number,
  total: number,
  onMove: (newIndex: number) => void,
) {
  if (!reorderable) return undefined;
  return {
    isFirst: index === 0,
    isLast: index === total - 1,
    onMoveUp: () => onMove(index - 1),
    onMoveDown: () => onMove(index + 1),
  };
}
