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

  it('authenticateByName returns token + userId', async () => {
    stub({
      status: 200,
      _body: JSON.stringify({ AccessToken: 'tok', User: { Id: 'uid' } }),
    } as never);
    expect(await authenticateByName('cadence-test', 'pw')).toEqual({ token: 'tok', userId: 'uid' });
  });

  it('validateToken returns the user on success', async () => {
    stub({ status: 200, _body: JSON.stringify({ Id: 'uid', Name: 'cadence-test' }) } as never);
    expect(await validateToken({ token: 't', userId: 'uid' })).toEqual({
      Id: 'uid',
      Name: 'cadence-test',
    });
  });

  it('validateToken returns null on a 401 (dead token)', async () => {
    stub({ status: 401 } as never);
    expect(await validateToken({ token: 'bad', userId: 'uid' })).toBeNull();
  });

  it('validateToken rethrows a transient error', async () => {
    stub({ status: 500 } as never);
    await expect(validateToken({ token: 't', userId: 'uid' })).rejects.not.toBeInstanceOf(
      Unauthenticated,
    );
  });
});
