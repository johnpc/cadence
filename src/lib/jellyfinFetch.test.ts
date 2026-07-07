import { afterEach, describe, expect, it, vi } from 'vitest';
import { request, Unauthenticated } from './jellyfinFetch';
import { setSession } from './sessionStore';

function mockFetch(status: number, body: unknown = {}) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? '' : JSON.stringify(body)),
  } as Response);
}

describe('jellyfinFetch.request', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('GETs and parses JSON, attaching the emby auth header', async () => {
    const f = mockFetch(200, { Name: 'cadence-test' });
    vi.stubGlobal('fetch', f);
    const result = await request<{ Name: string }>('/Users/Me', { token: 'tok' });
    expect(result).toEqual({ Name: 'cadence-test' });
    const [, init] = f.mock.calls[0];
    expect(init.headers['X-Emby-Authorization']).toContain('Token="tok"');
    expect(init.headers['Authorization']).toBe('MediaBrowser Token="tok"');
  });

  it('JSON-encodes a POST body', async () => {
    const f = mockFetch(200, { AccessToken: 'x' });
    vi.stubGlobal('fetch', f);
    await request('/Users/AuthenticateByName', { method: 'POST', body: { Username: 'u' } });
    const [, init] = f.mock.calls[0];
    expect(init.body).toBe(JSON.stringify({ Username: 'u' }));
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('throws Unauthenticated on 401', async () => {
    vi.stubGlobal('fetch', mockFetch(401));
    await expect(request('/Users/Me')).rejects.toBeInstanceOf(Unauthenticated);
  });

  it('throws a generic error on other non-2xx', async () => {
    vi.stubGlobal('fetch', mockFetch(500));
    await expect(request('/Items')).rejects.toThrow(/500/);
  });

  it('returns undefined on 204', async () => {
    vi.stubGlobal('fetch', {
      ...mockFetch(204),
    } as never);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, status: 204, text: async () => '' } as Response),
    );
    expect(await request('/Users/x/FavoriteItems/y', { method: 'POST' })).toBeUndefined();
  });

  it('falls back to the stored session token when none is passed', async () => {
    setSession({ token: 'stored', userId: 'u' });
    const f = mockFetch(200, {});
    vi.stubGlobal('fetch', f);
    await request('/Items');
    const [, init] = f.mock.calls[0];
    expect(init.headers['Authorization']).toBe('MediaBrowser Token="stored"');
  });
});
