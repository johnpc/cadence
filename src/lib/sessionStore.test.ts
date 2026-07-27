import { afterEach, describe, expect, it } from 'vitest';
import { getSession, setSession } from './sessionStore';

const session = { username: 'u', userId: 'uid', subsonicSalt: 's', subsonicToken: 't' };

describe('sessionStore', () => {
  afterEach(() => setSession(null));

  it('starts empty', () => {
    expect(getSession()).toBeNull();
  });

  it('holds and clears the session', () => {
    setSession(session);
    expect(getSession()).toEqual(session);
    setSession(null);
    expect(getSession()).toBeNull();
  });
});
