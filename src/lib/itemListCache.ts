import type { JellyfinItem } from './jellyfinTypes';

/**
 * A namespaced localStorage cache of Jellyfin item lists (a playlist's tracks,
 * an album's tracks, an artist's albums…). These change rarely but are costly to
 * fetch over the tunnel, so we persist the last-seen list per id and seed the
 * query with it — a previously-opened page paints INSTANTLY from disk, then
 * react-query refetches in the background to catch any change.
 *
 * Survives reloads/app restarts (unlike the in-memory query cache). Each cache is
 * bounded (LRU by last-write) so it can't grow without limit. Factory returns the
 * three functions a query hook needs.
 */
export interface ItemListCache {
  /** Cached list for an id, or undefined when not cached. */
  get(id: string): JellyfinItem[] | undefined;
  /** Persist a list, evicting the oldest entries past the cap. */
  set(id: string, items: JellyfinItem[]): void;
  /** Fetch via `fetcher` then persist — use directly as a query fn. */
  fetchAndCache(
    id: string,
    fetcher: (id: string) => Promise<JellyfinItem[]>,
  ): Promise<JellyfinItem[]>;
  /** The localStorage key (so Clear-cache can flush it). */
  readonly storageKey: string;
}

type Entry = { at: number; items: JellyfinItem[] };
type Store = Record<string, Entry>;

export function createItemListCache(storageKey: string, max = 30): ItemListCache {
  const read = (): Store => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Store) : {};
    } catch {
      return {};
    }
  };

  const set = (id: string, items: JellyfinItem[]): void => {
    try {
      const store = read();
      store[id] = { at: Date.now(), items };
      const ids = Object.keys(store);
      if (ids.length > max) {
        ids
          .sort((a, b) => store[a].at - store[b].at)
          .slice(0, ids.length - max)
          .forEach((k) => delete store[k]);
      }
      localStorage.setItem(storageKey, JSON.stringify(store));
    } catch {
      /* storage full/unavailable — the in-memory query cache still applies */
    }
  };

  return {
    storageKey,
    get: (id) => read()[id]?.items,
    set,
    fetchAndCache: async (id, fetcher) => {
      const items = await fetcher(id);
      set(id, items);
      return items;
    },
  };
}
