import { Capacitor } from '@capacitor/core';
import { cacheBlobStore } from './cacheBlobStore';
import { filesystemBlobStore } from './filesystemBlobStore';

/**
 * Persistent binary storage for downloaded audio, abstracted so the durable
 * backend can differ by platform. Both backends key by track id and hand back a
 * URL an <audio> element can play.
 */
export interface BlobStore {
  /** Persist a track's audio bytes under its id. */
  putBlob(id: string, blob: Blob): Promise<void>;
  /** A playable URL for a stored track, or null if it isn't stored. */
  blobUrl(id: string): Promise<string | null>;
  /** Delete a stored track's bytes (best-effort). */
  removeBlob(id: string): Promise<void>;
}

/**
 * On native (iOS/Android) use the filesystem backend: files in the app's Data
 * directory are NEVER evicted (WebKit Cache Storage in a WKWebView can be purged
 * under storage pressure, silently losing a big offline library). On web/PWA use
 * Cache Storage — it's the only option there, and it's what makes the honest
 * offline CI test possible (Chromium runs the web build).
 */
export function selectBlobStore(): BlobStore {
  return Capacitor.isNativePlatform() ? filesystemBlobStore : cacheBlobStore;
}
