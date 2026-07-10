import type { BlobStore } from './blobStore';

/**
 * Cache Storage backend for downloaded audio (web/PWA). Bytes live in a
 * `cadence-downloads` cache bucket keyed by a synthetic URL; an in-memory
 * id→objectURL map gives the player a memoised src (creating a new object URL
 * per play would leak). Hydrates the map lazily from the cache on a miss.
 */
const CACHE = 'cadence-downloads';
const cacheKey = (id: string): string => `/cadence-download/${id}`;

const urls = new Map<string, string>();

async function putBlob(id: string, blob: Blob): Promise<void> {
  const cache = await caches.open(CACHE);
  await cache.put(cacheKey(id), new Response(blob));
}

async function blobUrl(id: string): Promise<string | null> {
  const cached = urls.get(id);
  if (cached) return cached;
  if (typeof caches === 'undefined') return null;
  const res = await caches.open(CACHE).then((c) => c.match(cacheKey(id)));
  if (!res) return null;
  const url = URL.createObjectURL(await res.blob());
  urls.set(id, url);
  return url;
}

async function removeBlob(id: string): Promise<void> {
  if (typeof caches !== 'undefined') {
    await caches.open(CACHE).then((c) => c.delete(cacheKey(id)));
  }
  const url = urls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urls.delete(id);
  }
}

export const cacheBlobStore: BlobStore = { putBlob, blobUrl, removeBlob };
