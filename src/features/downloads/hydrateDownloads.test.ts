import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('./downloadIndex', () => ({ hydrateDownloadIndex: vi.fn(() => Promise.resolve()) }));
vi.mock('../offline/offlinePlaylistStore', () => ({
  hydrateOfflinePlaylists: vi.fn(() => Promise.resolve()),
}));
import { hydrateDownloadIndex } from './downloadIndex';
import { hydrateOfflinePlaylists } from '../offline/offlinePlaylistStore';
import { hydrateDownloads } from './hydrateDownloads';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('hydrateDownloads', () => {
  it('loads both offline collections and asks for durable storage', async () => {
    const persist = vi.fn(() => Promise.resolve(true));
    vi.stubGlobal('navigator', { storage: { persist } });
    await hydrateDownloads();
    expect(hydrateDownloadIndex).toHaveBeenCalled();
    expect(hydrateOfflinePlaylists).toHaveBeenCalled();
    expect(persist).toHaveBeenCalled();
  });

  it('never blocks the first render past its budget', async () => {
    vi.useFakeTimers();
    vi.mocked(hydrateDownloadIndex).mockReturnValueOnce(new Promise(() => undefined));
    const done = vi.fn();
    void hydrateDownloads(100).then(done);
    await vi.advanceTimersByTimeAsync(100);
    expect(done).toHaveBeenCalled();
  });
});
