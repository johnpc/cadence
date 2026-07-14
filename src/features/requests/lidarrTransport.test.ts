import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinConfig', () => ({
  apiUrl: (path: string) => `https://jf.example.com${path}`,
  embyAuthHeader: (token?: string) => `MediaBrowser Token="${token ?? ''}"`,
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
  it('uses the same-origin nginx path (no auth header) when the plugin proxy is off', async () => {
    const f = stubFetch();
    await lidarrFetch('/rootfolder');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('/api/lidarr/rootfolder');
    expect((init as RequestInit).headers).not.toHaveProperty('X-Emby-Authorization');
  });

  it('routes through the Jellyfin plugin (with auth header) when the plugin proxy is on', async () => {
    window.__CADENCE_CONFIG__ = { lidarrProxy: true, lidarrPluginProxy: true };
    const f = stubFetch();
    await lidarrFetch('/search?term=x');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://jf.example.com/Cadence/Lidarr/search?term=x');
    const headers = (init as RequestInit).headers as Record<string, string>;
    expect(headers['X-Emby-Authorization']).toContain('Token="tok-1"');
    expect(headers['Authorization']).toContain('tok-1');
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

  it('POSTs through the plugin path when enabled', async () => {
    window.__CADENCE_CONFIG__ = { lidarrPluginProxy: true };
    const f = stubFetch();
    await lidarrPost('/artist', { a: 1 });
    expect(f.mock.calls[0][0]).toBe('https://jf.example.com/Cadence/Lidarr/artist');
  });
});
