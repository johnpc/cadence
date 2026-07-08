const KEY = 'cadence.recent-plays';
const MAX = 200;

/** id → last-played epoch ms. Powers the default "recently played first" order
 * of Your Library, so collections you play bubble up and stale ones drift down. */
export type RecentPlays = Record<string, number>;

export function getRecentPlays(): RecentPlays {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentPlays) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Stamp an item as played now (epoch ms injected for testability). Caps the
 * store to the most-recent MAX ids so it can't grow unbounded. */
export function touchRecentPlay(id: string, now: number): void {
  if (!id) return;
  try {
    const map = getRecentPlays();
    map[id] = now;
    const trimmed = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(Object.fromEntries(trimmed)));
  } catch {
    // best-effort
  }
}
