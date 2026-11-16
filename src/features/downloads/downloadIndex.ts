import { persistedCollection } from '../../lib/persistedCollection';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * The persisted list of downloaded tracks — the item metadata (title, artist,
 * art id, ids) for each saved track, newest first. Stored apart from the audio
 * bytes (downloadStore) so the Downloads screen renders the full list WITHOUT a
 * Jellyfin round-trip — the whole point of offline. Lives in IndexedDB (it was a
 * size-capped synchronous localStorage blob), mirrored in memory for the
 * synchronous "is this downloaded?" checks.
 */
const tracks = persistedCollection<JellyfinItem>({
  name: 'downloads',
  legacyKey: 'cadence.downloads.index',
  keyOf: (t) => t.Id,
});

/** Load the index (and migrate the old localStorage copy) — once, at boot. */
export const hydrateDownloadIndex = (): Promise<void> => tracks.hydrate();

/** Resolves once pending writes have reached IndexedDB. */
export const downloadIndexFlushed = (): Promise<void> => tracks.flushed();

/** The downloaded tracks, newest first. Never throws. */
export const readIndex = (): JellyfinItem[] => [...tracks.read()];

/** Add a track (newest first), replacing any entry with the same id. */
export const addToIndex = (item: JellyfinItem): void => tracks.put(item);

/** Remove a track from the index by id. */
export const removeFromIndex = (id: string): void => tracks.remove(id);

/** The set of downloaded track ids — a quick "is this downloaded?" check
 * without materialising blob URLs. */
export const indexedIds = (): Set<string> => new Set(tracks.read().map((t) => t.Id));
