import { afterEach, describe, expect, it } from 'vitest';
import { getSession, setSession } from './sessionStore';

describe('sessionStore', () => {
  afterEach(() => setSession(null));

  it('starts empty', () => {
    expect(getSession()).toBeNull();
  });

  it('holds and clears the session', () => {
    setSession({ token: 't', userId: 'u' });
    expect(getSession()).toEqual({ token: 't', userId: 'u' });
    setSession(null);
    expect(getSession()).toBeNull();
  });
});
