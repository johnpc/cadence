import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinStream', () => ({
  audioStreamUrl: (id: string) => `https://jf.test/Audio/${id}/universal`,
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

  it('downloads: fetches the stream, stores the blob, and indexes the item', async () => {
    await downloadTrack(track('a'));
    expect(fetch).toHaveBeenCalledWith('https://jf.test/Audio/a/universal');
    expect(put).toHaveBeenCalledOnce();
    expect(put.mock.calls[0][0]).toBe('a'); // stored under the track id
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
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(isDownloaded('a')).toBe(true);
  });

  it('remove deletes the blob and de-indexes it', async () => {
    await downloadTrack(track('a'));
    await removeDownload('a');
    expect(remove).toHaveBeenCalledWith('a');
    expect(isDownloaded('a')).toBe(false);
    expect(await localAudioUrl('a')).toBeNull();
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
