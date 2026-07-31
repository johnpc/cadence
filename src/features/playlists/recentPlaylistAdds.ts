/**
 * Tracks which playlists you most recently ADDED a song to, so the "Add to
 * playlist" sheet can surface them first (below hearted playlists). Persisted in
 * localStorage; id → last-added epoch ms.
 */
const KEY = 'cadence.recent-playlist-adds';
const MAX = 50;

export type RecentAdds = Record<string, number>;

export function getRecentPlaylistAdds(): RecentAdds {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentAdds) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Stamp a playlist as just-added-to (epoch ms injected for testability). Caps
 * the store to the most-recent MAX ids so it can't grow unbounded. */
export function touchPlaylistAdd(playlistId: string, now: number): void {
  if (!playlistId) return;
  try {
    const map = getRecentPlaylistAdds();
    map[playlistId] = now;
    const trimmed = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(trimmed)));
  } catch {
    // best-effort
  }
}
