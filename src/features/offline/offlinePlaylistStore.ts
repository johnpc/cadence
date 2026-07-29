import { emitDownloadsChange as emit, onDownloadsChange } from '../downloads/downloadEmitter';

/**
 * The identities of playlists the user has downloaded — {id, name, trackIds}, in
 * localStorage. Albums/artists/audiobooks are derivable from the per-track
 * download index (each track carries its Album/Artist/Type), but a PLAYLIST is
 * an arbitrary server-side grouping with no per-track backreference, so its
 * membership must be saved explicitly to reconstruct it fully offline. Repaints
 * ride the shared downloads emitter so offline views update in lockstep with the
 * track index.
 */
const KEY = 'cadence.offline.playlists';

export interface OfflinePlaylist {
  id: string;
  name: string;
  /** Track ids in playlist order (intersected with the download index at read). */
  trackIds: string[];
}

export { onDownloadsChange };

/** Read saved offline playlists. Tolerates absent/corrupt storage (returns []). */
export function readOfflinePlaylists(): OfflinePlaylist[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflinePlaylist[]) : [];
  } catch {
    return [];
  }
}

/** Save (or replace) a playlist's offline identity, then emit so views repaint. */
export function saveOfflinePlaylist(pl: OfflinePlaylist): void {
  const next = [pl, ...readOfflinePlaylists().filter((p) => p.id !== pl.id)];
  localStorage.setItem(KEY, JSON.stringify(next));
  emit();
}

/** Forget a playlist's offline identity (its tracks are removed separately). */
export function removeOfflinePlaylist(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(readOfflinePlaylists().filter((p) => p.id !== id)));
  emit();
}
