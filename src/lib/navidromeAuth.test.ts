import { afterEach, describe, expect, it, vi } from 'vitest';
import { authenticateByName, validateToken } from './navidromeAuth';
import { Unauthenticated } from './navidromeFetch';

function stubLogin(status: number, body: unknown = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
    } as Response),
  );
}

function stubSubsonic(status: number, envelope: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => JSON.stringify({ 'subsonic-response': envelope }),
    } as Response),
  );
}

const session = {
  username: 'cadence-test',
  userId: 'u1',
  subsonicSalt: 'salt1',
  subsonicToken: 'tok1',
};

describe('navidromeAuth', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('authenticateByName returns the Subsonic session credentials', async () => {
    stubLogin(200, {
      id: 'u1',
      username: 'cadence-test',
      subsonicSalt: 'salt1',
      subsonicToken: 'tok1',
      token: 'jwt-unused',
    });
    expect(await authenticateByName('cadence-test', 'pw')).toEqual(session);
  });

  it('authenticateByName throws Unauthenticated on a 401', async () => {
    stubLogin(401);
    await expect(authenticateByName('cadence-test', 'bad')).rejects.toBeInstanceOf(Unauthenticated);
  });

  it('authenticateByName throws on any other non-2xx', async () => {
    stubLogin(500);
    await expect(authenticateByName('cadence-test', 'pw')).rejects.toThrow(/500/);
  });

  it('validateToken returns true on success', async () => {
    stubSubsonic(200, { status: 'ok', user: { username: 'cadence-test' } });
    expect(await validateToken(session)).toBe(true);
  });

  it('validateToken returns false on a confirmed bad credential (code 40)', async () => {
    stubSubsonic(200, { status: 'failed', error: { code: 40, message: 'bad' } });
    expect(await validateToken(session)).toBe(false);
  });

  it('validateToken rethrows a transient error', async () => {
    stubSubsonic(500, {});
    await expect(validateToken(session)).rejects.not.toBeInstanceOf(Unauthenticated);
  });
});
