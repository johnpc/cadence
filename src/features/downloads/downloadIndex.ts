import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * The persisted list of downloaded tracks — the item metadata (title, artist,
 * art id, ids) for each saved track, in localStorage. Stored separately from
 * the audio blobs (downloadStore) so the Downloads screen can render the full
 * list WITHOUT a Jellyfin round-trip — the whole point of offline: the list
 * itself must survive with no network.
 */
const INDEX_KEY = 'cadence.downloads.index';

/** Read the downloaded-track index. Tolerates absent/corrupt storage (returns
 * []), so a bad write can never blank the screen with a throw. */
export function readIndex(): JellyfinItem[] {
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as JellyfinItem[]) : [];
  } catch {
    return [];
  }
}

/** Add a track to the index (newest first), replacing any existing entry with
 * the same id so re-downloading doesn't duplicate the row. */
export function addToIndex(item: JellyfinItem): void {
  const next = [item, ...readIndex().filter((t) => t.Id !== item.Id)];
  localStorage.setItem(INDEX_KEY, JSON.stringify(next));
}

/** Remove a track from the index by id. */
export function removeFromIndex(id: string): void {
  localStorage.setItem(INDEX_KEY, JSON.stringify(readIndex().filter((t) => t.Id !== id)));
}

/** The set of downloaded track ids — for a quick "is this downloaded?" check
 * without materialising blob URLs. */
export function indexedIds(): Set<string> {
  return new Set(readIndex().map((t) => t.Id));
}
