import { afterEach, describe, expect, it, vi } from 'vitest';
import { getRecentPlays, subscribeRecentPlays, touchRecentPlay } from './recentPlays';

describe('recentPlays', () => {
  afterEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(getRecentPlays()).toEqual({});
  });

  it('records and updates a play timestamp', () => {
    touchRecentPlay('a', 1000);
    touchRecentPlay('b', 2000);
    expect(getRecentPlays()).toEqual({ a: 1000, b: 2000 });
    touchRecentPlay('a', 3000);
    expect(getRecentPlays().a).toBe(3000);
  });

  it('ignores a blank id', () => {
    touchRecentPlay('', 1000);
    expect(getRecentPlays()).toEqual({});
  });

  it('tolerates corrupt storage', () => {
    localStorage.setItem('cadence.recent-plays', 'not json');
    expect(getRecentPlays()).toEqual({});
  });

  it('notifies subscribers on a play, and stops after unsubscribe', () => {
    const spy = vi.fn();
    const unsub = subscribeRecentPlays(spy);
    touchRecentPlay('a', 1000);
    expect(spy).toHaveBeenCalledTimes(1);
    unsub();
    touchRecentPlay('b', 2000);
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
