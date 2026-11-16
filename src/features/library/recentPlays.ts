import { createStoredValue } from '../../lib/store';

const KEY = 'cadence.recent-plays';
const MAX = 200;

/** id → last-played epoch ms. Powers the default "recently played first" order
 * of Your Library, so collections you play bubble up and stale ones drift down. */
export type RecentPlays = Record<string, number>;

function parse(raw: string | null): RecentPlays {
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as RecentPlays)
      : {};
  } catch {
    return {};
  }
}

const recentPlaysStore = createStoredValue<RecentPlays>({
  key: KEY,
  parse,
  serialize: JSON.stringify,
});

/** Subscribe to recent-plays changes (for useSyncExternalStore). Returns an
 * unsubscribe fn. Lets the Home "Jump back in" shelf update live when you play
 * something, without a reload. */
export const subscribeRecentPlays = (listener: () => void): (() => void) =>
  recentPlaysStore.subscribe(listener);

export const getRecentPlays = (): RecentPlays => recentPlaysStore.get();

/** Stamp an item as played now (epoch ms injected for testability). Caps the
 * store to the most-recent MAX ids so it can't grow unbounded, then notifies
 * subscribers so live surfaces (Home's "Jump back in") refresh. */
export function touchRecentPlay(id: string, now: number): void {
  if (!id) return;
  recentPlaysStore.update((map) =>
    Object.fromEntries(
      Object.entries({ ...map, [id]: now })
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX),
    ),
  );
}
