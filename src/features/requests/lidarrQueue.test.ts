import { afterEach, describe, expect, it, vi } from 'vitest';
import { getDownloadQueue } from './lidarrQueue';

function stubFetch(impl: () => Partial<Response>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(impl() as Response)),
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getDownloadQueue', () => {
  it('maps queue records to title + progress %', async () => {
    stubFetch(() => ({
      ok: true,
      json: async () => ({
        records: [
          { id: 1, title: 'In Rainbows', size: 100, sizeleft: 25 },
          { id: 2, title: 'OK Computer', size: 200, sizeleft: 0 },
        ],
      }),
    }));
    const out = await getDownloadQueue();
    expect(out).toEqual([
      { id: 1, title: 'In Rainbows', percent: 75 },
      { id: 2, title: 'OK Computer', percent: 100 },
    ]);
  });

  it('reports 0% when the size is unknown (avoids NaN)', async () => {
    stubFetch(() => ({ ok: true, json: async () => ({ records: [{ id: 3 }] }) }));
    const out = await getDownloadQueue();
    expect(out[0]).toEqual({ id: 3, title: 'Downloading…', percent: 0 });
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
