import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDownloadQueue, queueStatus } from './lidarrQueue';

function stubFetch(impl: () => Partial<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(impl() as Response)),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('queueStatus', () => {
  it('reads paused / completed from status', () => {
    expect(queueStatus({ id: 1, status: 'paused' })).toBe('paused');
    expect(queueStatus({ id: 2, status: 'completed' })).toBe('completed');
  });

  it('reads importing / import-failed from trackedDownloadState', () => {
    expect(queueStatus({ id: 3, trackedDownloadState: 'importing' })).toBe('importing');
    expect(queueStatus({ id: 4, trackedDownloadState: 'importPending' })).toBe('importing');
    expect(queueStatus({ id: 5, trackedDownloadState: 'importFailed', status: 'completed' })).toBe(
      'import failed',
    );
  });

  it('defaults to downloading', () => {
    expect(queueStatus({ id: 6, status: 'downloading' })).toBe('downloading');
    expect(queueStatus({ id: 7 })).toBe('downloading');
  });
});

describe('getDownloadQueue', () => {
  it('labels rows with the ARTIST, keeps the release as a subtitle, + status', async () => {
    stubFetch(() => ({
      ok: true,
      json: async () => ({
        records: [
          {
            id: 1,
            title: 'Radiohead-In.Rainbows-FLAC-2007',
            size: 100,
            sizeleft: 25,
            status: 'downloading',
            artist: { artistName: 'Radiohead' },
          },
        ],
      }),
    }));
    const out = await getDownloadQueue();
    expect(out).toEqual([
      {
        id: 1,
        title: 'Radiohead',
        release: 'Radiohead-In.Rainbows-FLAC-2007',
        status: 'downloading',
        percent: 75,
      },
    ]);
  });

  it('surfaces a paused grab as status "paused" (not a frozen bar)', async () => {
    stubFetch(() => ({
      ok: true,
      json: async () => ({
        records: [
          {
            id: 2,
            title: 'A.Day.to.Remember-Old.Record',
            size: 100,
            sizeleft: 48,
            status: 'paused',
            artist: { artistName: 'A Day to Remember' },
          },
        ],
      }),
    }));
    const [row] = await getDownloadQueue();
    expect(row).toMatchObject({ title: 'A Day to Remember', status: 'paused', percent: 52 });
  });

  it('falls back to the release title when the artist is absent', async () => {
    stubFetch(() => ({ ok: true, json: async () => ({ records: [{ id: 3 }] }) }));
    const out = await getDownloadQueue();
    expect(out[0]).toEqual({
      id: 3,
      title: 'Downloading…',
      release: undefined,
      status: 'downloading',
      percent: 0,
    });
  });

  it('returns [] for an empty queue (the common case)', async () => {
    stubFetch(() => ({ ok: true, json: async () => ({ records: [] }) }));
    expect(await getDownloadQueue()).toEqual([]);
  });

  it('returns [] (not an error) when the queue fetch fails', async () => {
    stubFetch(() => ({ ok: false, status: 502, json: async () => ({}) }));
    expect(await getDownloadQueue()).toEqual([]);
  });
});
