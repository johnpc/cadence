import { audioStreamUrl } from '../../lib/jellyfinStream';
import { addToIndex, removeFromIndex, readIndex } from './downloadIndex';
import { selectBlobStore } from './blobStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Persistent offline audio. The track's bytes go to a platform-appropriate blob
 * store (Cache Storage on web, the app's Filesystem on native — see blobStore),
 * and its metadata to a localStorage index so the Downloads screen renders with
 * NO server round-trip. Listeners repaint on change.
 */
const store = selectBlobStore();

const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

/** Subscribe to download add/remove events (drives reactive UI). */
export function onDownloadsChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** A local, playable URL for a downloaded track, or null if not downloaded. */
export async function localAudioUrl(id: string): Promise<string | null> {
  return store.blobUrl(id);
}

/** Fetch the track's audio and store it for offline playback, then index its
 * metadata. Retries once on a transient failure — downloading a whole album at
 * once can drop the odd connection, and one blip shouldn't permanently fail a
 * track. Throws only if both attempts fail. */
export async function downloadTrack(item: JellyfinItem): Promise<void> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(audioStreamUrl(item.Id));
      if (!res.ok) throw new Error(`download failed: ${res.status}`);
      await store.putBlob(item.Id, await res.blob());
      addToIndex(item);
      emit();
      return;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('download failed');
}

/** Delete a downloaded track's bytes + index entry. */
export async function removeDownload(id: string): Promise<void> {
  await store.removeBlob(id);
  removeFromIndex(id);
  emit();
}

/** Delete EVERY downloaded track (bytes + index). Removes blobs first (each is
 * best-effort inside the backend), then clears the index and emits once so the
 * UI updates a single time rather than per track. */
export async function removeAllDownloads(): Promise<void> {
  const ids = readIndex().map((t) => t.Id);
  await Promise.all(ids.map((id) => store.removeBlob(id)));
  for (const id of ids) removeFromIndex(id);
  emit();
}

/** Whether a track id is in the downloaded index (sync, cheap). */
export function isDownloaded(id: string): boolean {
  return readIndex().some((t) => t.Id === id);
}
