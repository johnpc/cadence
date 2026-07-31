import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Order playlists for the "Add to playlist" picker: hearted (favorite) first,
 * then the ones you most recently added to, then the rest in their given order.
 * Stable within each group. Pure so the ordering is unit-testable. `recentAdds`
 * is id → last-added epoch ms (0/absent = never added to). */
export function orderPlaylistsForPicker(
  playlists: JellyfinItem[],
  recentAdds: Record<string, number> = {},
): JellyfinItem[] {
  const rank = (p: JellyfinItem): number => {
    if (p.UserData?.IsFavorite) return 2;
    return recentAdds[p.Id] ? 1 : 0;
  };
  return playlists
    .map((p, i) => ({ p, i }))
    .sort(
      (a, b) =>
        rank(b.p) - rank(a.p) || (recentAdds[b.p.Id] ?? 0) - (recentAdds[a.p.Id] ?? 0) || a.i - b.i,
    )
    .map((e) => e.p);
}
