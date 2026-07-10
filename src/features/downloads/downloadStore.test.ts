import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  localAudioUrl,
  downloadTrack,
  removeDownload,
  isDownloaded,
  onDownloadsChange,
} from './downloadStore';
import { readIndex } from './downloadIndex';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

vi.mock('../../lib/jellyfinStream', () => ({
  audioStreamUrl: (id: string) => `https://jf.test/Audio/${id}/universal`,
}));

const track = (Id: string): JellyfinItem => ({ Id, Name: Id }) as JellyfinItem;

/** A minimal in-memory Cache Storage: one bucket, Request-key → Response. */
function fakeCaches() {
  const store = new Map<string, Response>();
  return {
    open: vi.fn().mockResolvedValue({
      match: (k: string) => Promise.resolve(store.get(k)),
      put: (k: string, res: Response) => {
        store.set(k, res);
        return Promise.resolve();
      },
      delete: (k: string) => Promise.resolve(store.delete(k)),
    }),
    _store: store,
  };
}

describe('downloadStore', () => {
  beforeEach(() => {
    vi.stubGlobal('caches', fakeCaches());
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('audio-bytes', { status: 200 })));
    let n = 0;
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => `blob:mock/${n++}`),
      revokeObjectURL: vi.fn(),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('downloads: fetches the stream, indexes the item, and reports downloaded', async () => {
    await downloadTrack(track('a'));
    expect(fetch).toHaveBeenCalledWith('https://jf.test/Audio/a/universal');
    expect(isDownloaded('a')).toBe(true);
    expect(readIndex().map((t) => t.Id)).toEqual(['a']);
  });

  it('localAudioUrl returns a blob URL for a downloaded track, null otherwise', async () => {
    expect(await localAudioUrl('a')).toBeNull();
    await downloadTrack(track('a'));
    const url = await localAudioUrl('a');
    expect(url).toMatch(/^blob:mock\//);
    // Second call reuses the same memoised URL (no new object URL).
    expect(await localAudioUrl('a')).toBe(url);
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('throws when the stream fetch fails, leaving nothing indexed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(downloadTrack(track('a'))).rejects.toThrow('download failed: 404');
    expect(isDownloaded('a')).toBe(false);
  });

  it('remove deletes the download, revokes its URL, and de-indexes it', async () => {
    await downloadTrack(track('a'));
    await localAudioUrl('a'); // materialise the object URL so revoke has a target
    await removeDownload('a');
    expect(isDownloaded('a')).toBe(false);
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    expect(await localAudioUrl('a')).toBeNull();
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
