import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinConfig', () => ({
  apiUrl: (path: string) => `https://jf.example.com${path}`,
  authHeaders: (token?: string) => {
    const value = `MediaBrowser Token="${token ?? ''}"`;
    return { Authorization: value, 'X-Emby-Authorization': value };
  },
}));
vi.mock('../../lib/sessionStore', () => ({ getSession: () => ({ token: 'tok-1', userId: 'u1' }) }));

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
  delete window.__CADENCE_CONFIG__;
});

describe('lidarrTransport', () => {
  it("GETs through the Jellyfin plugin with the user's auth header", async () => {
    const f = stubFetch();
    await lidarrFetch('/search?term=x');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://jf.example.com/Cadence/Lidarr/search?term=x');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['X-Emby-Authorization']).toContain('Token="tok-1"');
    expect(headers['Authorization']).toContain('tok-1');
    expect((init as RequestInit).method).toBe('GET');
    expect(headers).not.toHaveProperty('Content-Type');
  });

  it('POSTs a JSON body through the plugin with auth + content-type', async () => {
    const f = stubFetch();
    await lidarrPost('/artist', { foreignArtistId: 'mb-1' });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://jf.example.com/Cadence/Lidarr/artist');
    expect((init as RequestInit).method).toBe('POST');
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({ foreignArtistId: 'mb-1' });
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers).toHaveProperty('Content-Type', 'application/json');
    expect(headers['Authorization']).toContain('tok-1');
  });

  it('never calls the removed same-origin /api/lidarr proxy', async () => {
    window.__CADENCE_CONFIG__ = { lidarrProxy: true };
    const f = stubFetch();
    await lidarrFetch('/rootfolder');
    expect(f.mock.calls[0][0]).not.toContain('/api/lidarr');
  });
});
