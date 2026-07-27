import { afterEach, describe, expect, it, vi } from 'vitest';

import { lidarrFetch, lidarrPost } from './lidarrTransport';

function stubFetch() {
  const f = vi.fn((_url: string, _init?: RequestInit) =>
    Promise.resolve({ ok: true, status: 200, json: async () => ({}) } as Response),
  );
  vi.stubGlobal('fetch', f);
  return f;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('lidarrTransport', () => {
  it('GETs through the same-origin nginx path', async () => {
    const f = stubFetch();
    await lidarrFetch('/rootfolder');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('/api/lidarr/rootfolder');
    expect((init as RequestInit).method).toBe('GET');
  });

  it('POSTs a JSON body through the nginx path with a content-type', async () => {
    const f = stubFetch();
    await lidarrPost('/artist', { foreignArtistId: 'mb-1' });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('/api/lidarr/artist');
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ foreignArtistId: 'mb-1' });
    expect((init as RequestInit).headers).toHaveProperty('Content-Type', 'application/json');
  });
});
