import { persistedCollection } from '../../lib/persistedCollection';
import { emitDownloadsChange as emit, onDownloadsChange } from '../downloads/downloadEmitter';

/**
 * The identities of playlists the user has downloaded — {id, name, trackIds}.
 * Albums/artists/audiobooks are derivable from the per-track
 * download index (each track carries its Album/Artist/Type), but a PLAYLIST is
 * an arbitrary server-side grouping with no per-track backreference, so its
 * membership must be saved explicitly to reconstruct it fully offline. Stored in
 * IndexedDB beside the download index. Repaints ride the shared downloads emitter so offline views update in lockstep with the
 * track index.
 */
export interface OfflinePlaylist {
  id: string;
  name: string;
  /** Track ids in playlist order (intersected with the download index at read). */
  trackIds: string[];
}

const playlists = persistedCollection<OfflinePlaylist>({
  name: 'offline-playlists',
  legacyKey: 'cadence.offline.playlists',
  keyOf: (p) => p.id,
});

export { onDownloadsChange };

/** Load saved offline playlists (and migrate the old localStorage copy) at boot. */
export const hydrateOfflinePlaylists = (): Promise<void> => playlists.hydrate();

/** Saved offline playlists, newest first. Never throws. */
export const readOfflinePlaylists = (): OfflinePlaylist[] => [...playlists.read()];

/** Save (or replace) a playlist's offline identity, then emit so views repaint. */
export function saveOfflinePlaylist(pl: OfflinePlaylist): void {
  playlists.put(pl);
  emit();
}

/** Forget a playlist's offline identity (its tracks are removed separately). */
export function removeOfflinePlaylist(id: string): void {
  playlists.remove(id);
  emit();
}
