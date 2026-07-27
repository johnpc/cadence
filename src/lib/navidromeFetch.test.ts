import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  request,
  Unauthenticated,
  RequestTimeout,
  HttpError,
  SubsonicError,
} from './navidromeFetch';
import { setSession } from './sessionStore';
import { onSessionExpired } from './sessionExpiry';

function mockFetch(status: number, envelope: unknown = { status: 'ok' }) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify({ 'subsonic-response': envelope }),
  } as Response);
}

const session = {
  username: 'cadence-test',
  userId: 'u1',
  subsonicSalt: 'salt1',
  subsonicToken: 'tok1',
};

describe('navidromeFetch.request', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('GETs with the auth params in the query string and unwraps the envelope', async () => {
    const f = mockFetch(200, { status: 'ok', user: { username: 'cadence-test' } });
    vi.stubGlobal('fetch', f);
    const result = await request<{ user: { username: string } }>('/getUser', { session });
    expect(result).toEqual({ status: 'ok', user: { username: 'cadence-test' } });
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/rest/getUser?');
    expect(url).toContain('u=cadence-test');
    expect(url).toContain('t=tok1');
    expect(url).toContain('s=salt1');
    expect(init.method).toBe('GET');
  });

  it('falls back to the stored session when none is passed', async () => {
    setSession(session);
    const f = mockFetch(200);
    vi.stubGlobal('fetch', f);
    await request('/ping');
    expect(f.mock.calls[0][0]).toContain('u=cadence-test');
  });

  it('sends call-specific params, repeating array values under the same key', async () => {
    const f = mockFetch(200);
    vi.stubGlobal('fetch', f);
    await request('/star', { session, params: { id: ['a', 'b'], albumId: 'al1' } });
    const url = f.mock.calls[0][0] as string;
    expect(url).toContain('id=a');
    expect(url).toContain('id=b');
    expect(url).toContain('albumId=al1');
  });

  it('POSTs params as a form-urlencoded body, not a query string', async () => {
    const f = mockFetch(200);
    vi.stubGlobal('fetch', f);
    await request('/createPlaylist', { session, method: 'POST', params: { name: 'Mix' } });
    const [url, init] = f.mock.calls[0];
    expect(url).not.toContain('name=Mix');
    expect(init.body).toContain('name=Mix');
    expect(init.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
  });

  it('throws Unauthenticated and notifies subscribers on Subsonic error code 40', async () => {
    const spy = vi.fn();
    const off = onSessionExpired(spy);
    vi.stubGlobal(
      'fetch',
      mockFetch(200, {
        status: 'failed',
        error: { code: 40, message: 'Wrong username or password' },
      }),
    );
    await expect(request('/getUser', { session })).rejects.toBeInstanceOf(Unauthenticated);
    expect(spy).toHaveBeenCalledOnce();
    off();
  });

  it('throws SubsonicError for any other failed status', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetch(200, { status: 'failed', error: { code: 70, message: 'Data not found' } }),
    );
    const err = await request('/getSong', { session }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(SubsonicError);
    expect((err as SubsonicError).code).toBe(70);
  });

  it('throws HttpError on a non-2xx HTTP response', async () => {
    vi.stubGlobal('fetch', mockFetch(502));
    await expect(request('/getUser', { session })).rejects.toBeInstanceOf(HttpError);
  });

  it('throws RequestTimeout when the fetch is aborted', async () => {
    const abortErr = new DOMException('aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abortErr));
    await expect(request('/getUser', { session })).rejects.toBeInstanceOf(RequestTimeout);
  });

  it('passes an abort signal so the request is bounded by a timeout', async () => {
    const f = mockFetch(200);
    vi.stubGlobal('fetch', f);
    await request('/getUser', { session });
    expect(f.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});
