import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import type { BlobStore } from './blobStore';
import { blobToBase64 } from './base64';

/**
 * Capacitor Filesystem backend for downloaded audio (native iOS/Android). Files
 * live in the app's Data directory, which — unlike a WKWebView's Cache Storage —
 * is NEVER evicted under storage pressure, so a large offline library survives.
 * The player src is a native file URL run through `convertFileSrc` so the
 * WKWebView can load it.
 */
const DIR = Directory.Data;
const path = (id: string): string => `downloads/${id}.audio`;

async function putBlob(id: string, blob: Blob): Promise<void> {
  // Filesystem writes binary as base64 (no Blob API on the native bridge).
  await Filesystem.writeFile({
    path: path(id),
    data: await blobToBase64(blob),
    directory: DIR,
    recursive: true,
  });
}

async function blobUrl(id: string): Promise<string | null> {
  try {
    const { uri } = await Filesystem.getUri({ path: path(id), directory: DIR });
    return Capacitor.convertFileSrc(uri);
  } catch {
    return null; // not downloaded (getUri throws for a missing file)
  }
}

async function removeBlob(id: string): Promise<void> {
  try {
    await Filesystem.deleteFile({ path: path(id), directory: DIR });
  } catch {
    /* already gone — best-effort */
  }
}

export const filesystemBlobStore: BlobStore = { putBlob, blobUrl, removeBlob };
