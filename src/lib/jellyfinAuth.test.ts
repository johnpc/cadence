import { afterEach, describe, expect, it, vi } from 'vitest';
import { authenticateByName, validateToken } from './jellyfinAuth';
import { Unauthenticated } from './jellyfinFetch';

function stub(res: Partial<Response> & { status: number }) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      text: async () => (res as { _body?: string })._body ?? '',
    } as Response),
  );
}

describe('jellyfinAuth', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('authenticateByName returns token + userId (non-admin)', async () => {
    stub({
      status: 200,
      _body: JSON.stringify({ AccessToken: 'tok', User: { Id: 'uid' } }),
    } as never);
    expect(await authenticateByName('cadence-test', 'pw')).toEqual({
      token: 'tok',
      userId: 'uid',
      isAdmin: false,
    });
  });

  it('authenticateByName flags an admin user', async () => {
    stub({
      status: 200,
      _body: JSON.stringify({
        AccessToken: 'tok',
        User: { Id: 'uid', Policy: { IsAdministrator: true } },
      }),
    } as never);
    expect((await authenticateByName('admin', 'pw')).isAdmin).toBe(true);
  });

  it('validateToken returns the user on success', async () => {
    stub({ status: 200, _body: JSON.stringify({ Id: 'uid', Name: 'cadence-test' }) } as never);
    expect(await validateToken({ token: 't', userId: 'uid' })).toEqual({
      Id: 'uid',
      Name: 'cadence-test',
    });
  });

  it('validateToken returns null on a token that 401s on EVERY attempt (confirmed dead)', async () => {
    stub({ status: 401 } as never);
    const noWait = () => Promise.resolve();
    expect(await validateToken({ token: 'bad', userId: 'uid' }, 2, noWait)).toBeNull();
    // Re-checked before giving up: initial + 2 retries = 3 calls.
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('validateToken does NOT sign out on a transient 401 that then succeeds', async () => {
    // A spurious 401 (server under load / tunnel hiccup) followed by a good
    // response must resolve to the user — not null — so the app keeps the session.
    let call = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => {
        call++;
        const ok = call > 1;
        return Promise.resolve({
          ok,
          status: ok ? 200 : 401,
          text: async () => (ok ? JSON.stringify({ Id: 'uid', Name: 'cadence-test' }) : ''),
        } as Response);
      }),
    );
    const noWait = () => Promise.resolve();
    expect(await validateToken({ token: 't', userId: 'uid' }, 2, noWait)).toEqual({
      Id: 'uid',
      Name: 'cadence-test',
    });
  });

  it('validateToken rethrows a transient (non-401) error immediately', async () => {
    stub({ status: 500 } as never);
    await expect(validateToken({ token: 't', userId: 'uid' })).rejects.not.toBeInstanceOf(
      Unauthenticated,
    );
  });

  it('validateToken uses a real backoff between retries (default delay)', async () => {
    // Exercise the default backoff path (no injected delay) with fake timers so
    // the 300ms/600ms waits don't slow the suite. Confirmed-dead after 3 tries.
    vi.useFakeTimers();
    stub({ status: 401 } as never);
    const promise = validateToken({ token: 'bad', userId: 'uid' });
    await vi.runAllTimersAsync();
    expect(await promise).toBeNull();
    expect(fetch).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });
});
