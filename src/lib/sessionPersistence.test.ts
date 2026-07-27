import { beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.mock('@capacitor/preferences', () => ({
  Preferences: {
    get: vi.fn(async ({ key }: { key: string }) => ({ value: store.get(key) ?? null })),
    set: vi.fn(async ({ key, value }: { key: string; value: string }) => {
      store.set(key, value);
    }),
    remove: vi.fn(async ({ key }: { key: string }) => {
      store.delete(key);
    }),
  },
}));

import { clearStoredSession, loadStoredSession, storeSession } from './sessionPersistence';

const session = {
  username: 'cadence-test',
  userId: 'u',
  subsonicSalt: 'salt1',
  subsonicToken: 'tok1',
};

describe('sessionPersistence', () => {
  beforeEach(() => store.clear());

  it('returns null when nothing is stored', async () => {
    expect(await loadStoredSession()).toBeNull();
  });

  it('round-trips a stored session', async () => {
    await storeSession(session);
    expect(await loadStoredSession()).toEqual(session);
  });

  it('treats corrupt JSON as no session', async () => {
    store.set('cadence.session', '{not json');
    expect(await loadStoredSession()).toBeNull();
  });

  it('ignores a session missing required fields', async () => {
    store.set('cadence.session', JSON.stringify({ username: 'x' }));
    expect(await loadStoredSession()).toBeNull();
  });

  it('clears the stored session', async () => {
    await storeSession(session);
    await clearStoredSession();
    expect(await loadStoredSession()).toBeNull();
  });
});
