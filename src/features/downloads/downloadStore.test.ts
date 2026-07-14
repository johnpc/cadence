import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinStream', () => ({
  audioStreamUrl: (id: string) => `https://jf.test/Audio/${id}/universal`,
  imageUrl: (item: { Id: string }) => `https://jf.test/Items/${item.Id}/Images/Primary`,
}));

// A fake in-memory blob backend so the store logic (fetch → put → index → emit,
// retry, remove) is tested independently of Cache Storage / Filesystem.
const { backing, put, url, remove } = vi.hoisted(() => {
  const backing = new Map<string, Blob>();
  return {
    backing,
    put: vi.fn(async (id: string, blob: Blob) => {
      backing.set(id, blob);
    }),
    url: vi.fn(async (id: string) => (backing.has(id) ? `blob:mock/${id}` : null)),
    remove: vi.fn(async (id: string) => {
      backing.delete(id);
    }),
  };
});
vi.mock('./blobStore', () => ({
  selectBlobStore: () => ({ putBlob: put, blobUrl: url, removeBlob: remove }),
}));

import {
  localAudioUrl,
  localArtUrl,
  downloadTrack,
  removeDownload,
  isDownloaded,
  onDownloadsChange,
  removeAllDownloads,
} from './downloadStore';
import { readIndex } from './downloadIndex';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (Id: string): JellyfinItem => ({ Id, Name: Id }) as JellyfinItem;

describe('downloadStore', () => {
  beforeEach(() => {
    // A fresh Response per call — a single shared Response's body can only be
    // read once, which would break the multi-download test.
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockImplementation(() => Promise.resolve(new Response('audio-bytes', { status: 200 }))),
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    backing.clear();
    localStorage.clear();
  });

  it('downloads: fetches the stream + art, stores both blobs, and indexes the item', async () => {
    await downloadTrack(track('a'));
    expect(fetch).toHaveBeenCalledWith('https://jf.test/Audio/a/universal');
    expect(fetch).toHaveBeenCalledWith('https://jf.test/Items/a/Images/Primary');
    // Audio stored under the bare id; cover art under the "art:" key.
    const keys = put.mock.calls.map((c) => c[0]);
    expect(keys).toContain('a');
    expect(keys).toContain('art:a');
    expect(isDownloaded('a')).toBe(true);
    expect(readIndex().map((t) => t.Id)).toEqual(['a']);
  });

  it('localAudioUrl delegates to the backend', async () => {
    expect(await localAudioUrl('a')).toBeNull();
    await downloadTrack(track('a'));
    expect(await localAudioUrl('a')).toBe('blob:mock/a');
  });

  it('throws when the stream fetch fails on both attempts, storing nothing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(downloadTrack(track('a'))).rejects.toThrow('download failed: 404');
    expect(fetch).toHaveBeenCalledTimes(2); // retried once
    expect(put).not.toHaveBeenCalled();
    expect(isDownloaded('a')).toBe(false);
  });

  it('retries once and succeeds when the first fetch fails transiently', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('network blip'))
      .mockResolvedValueOnce(new Response('audio-bytes', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    await downloadTrack(track('a'));
    // 1 failed audio + 1 retried audio + 1 art fetch = 3.
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(isDownloaded('a')).toBe(true);
  });

  it('caches cover art for offline and localArtUrl returns it', async () => {
    expect(await localArtUrl('a')).toBeNull();
    await downloadTrack(track('a'));
    expect(await localArtUrl('a')).toBe('blob:mock/art:a');
  });

  it('remove deletes the audio + art blobs and de-indexes it', async () => {
    await downloadTrack(track('a'));
    await removeDownload('a');
    expect(remove).toHaveBeenCalledWith('a');
    expect(remove).toHaveBeenCalledWith('art:a'); // art blob cleaned up too
    expect(isDownloaded('a')).toBe(false);
    expect(await localAudioUrl('a')).toBeNull();
    expect(await localArtUrl('a')).toBeNull();
  });

  it('a failed art fetch does not fail the download (art is best-effort)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((u: string) =>
        u.includes('/Images/')
          ? Promise.reject(new Error('offline'))
          : Promise.resolve(new Response('audio-bytes', { status: 200 })),
      ),
    );
    await downloadTrack(track('a'));
    expect(isDownloaded('a')).toBe(true); // audio saved despite art failing
    expect(await localArtUrl('a')).toBeNull();
  });

  it('removeAllDownloads clears every blob + the whole index, emitting once', async () => {
    await downloadTrack(track('a'));
    await downloadTrack(track('b'));
    const seen: string[] = [];
    const off = onDownloadsChange(() => seen.push('x'));
    await removeAllDownloads();
    off();
    expect(remove).toHaveBeenCalledWith('a');
    expect(remove).toHaveBeenCalledWith('b');
    expect(readIndex()).toEqual([]);
    expect(seen).toEqual(['x']); // a single emit, not one per track
  });

  it('notifies subscribers on download and remove, and stops after unsubscribe', async () => {
    const seen: string[] = [];
    const off = onDownloadsChange(() => seen.push('x'));
    await downloadTrack(track('a'));
    await removeDownload('a');
    off();
    await downloadTrack(track('b'));
    expect(seen).toEqual(['x', 'x']);
  });
});
