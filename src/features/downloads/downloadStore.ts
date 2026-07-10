import { audioStreamUrl } from '../../lib/jellyfinStream';
import { addToIndex, removeFromIndex, readIndex } from './downloadIndex';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/**
 * Persistent offline audio: each downloaded track's bytes live in a Cache
 * Storage bucket (survives reloads, works in the PWA and the native WKWebView),
 * keyed by a stable synthetic URL. An in-memory id→blobURL map gives the player
 * a SYNCHRONOUS lookup at track-load time (creating an object URL per play would
 * leak); it's hydrated lazily from the cache. Listeners repaint on change.
 *
 * Cache Storage (not Capacitor Filesystem) so a single implementation covers
 * web + installed PWA + native, and CI's chromium can prove offline playback.
 */
const CACHE = 'cadence-downloads';
const cacheKey = (id: string): string => `/cadence-download/${id}`;

const urls = new Map<string, string>();
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

/** Subscribe to download add/remove events (drives reactive UI). */
export function onDownloadsChange(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** A local object URL for a downloaded track, or null if not downloaded. Reads
 * the in-memory map first; on a miss (e.g. first call after reload) it pulls the
 * blob from the cache and memoises a fresh object URL. */
export async function localAudioUrl(id: string): Promise<string | null> {
  const cached = urls.get(id);
  if (cached) return cached;
  if (typeof caches === 'undefined') return null;
  const res = await caches.open(CACHE).then((c) => c.match(cacheKey(id)));
  if (!res) return null;
  const url = URL.createObjectURL(await res.blob());
  urls.set(id, url);
  return url;
}

/** Fetch the track's audio and store it for offline playback, then index its
 * metadata. Throws on a failed fetch so the caller can surface an error. */
export async function downloadTrack(item: JellyfinItem): Promise<void> {
  const res = await fetch(audioStreamUrl(item.Id));
  if (!res.ok) throw new Error(`download failed: ${res.status}`);
  const cache = await caches.open(CACHE);
  await cache.put(cacheKey(item.Id), res);
  addToIndex(item);
  emit();
}

/** Delete a downloaded track's bytes + index entry and revoke its object URL. */
export async function removeDownload(id: string): Promise<void> {
  if (typeof caches !== 'undefined') {
    await caches.open(CACHE).then((c) => c.delete(cacheKey(id)));
  }
  const url = urls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urls.delete(id);
  }
  removeFromIndex(id);
  emit();
}

/** Whether a track id is in the downloaded index (sync, cheap). */
export function isDownloaded(id: string): boolean {
  return readIndex().some((t) => t.Id === id);
}
