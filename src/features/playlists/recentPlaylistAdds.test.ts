import { afterEach, describe, expect, it } from 'vitest';
import { getRecentPlaylistAdds, touchPlaylistAdd } from './recentPlaylistAdds';

describe('recentPlaylistAdds', () => {
  afterEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(getRecentPlaylistAdds()).toEqual({});
  });

  it('records the last-added time for a playlist', () => {
    touchPlaylistAdd('a', 1000);
    touchPlaylistAdd('b', 2000);
    expect(getRecentPlaylistAdds()).toEqual({ a: 1000, b: 2000 });
  });

  it('overwrites with the newer time on re-add', () => {
    touchPlaylistAdd('a', 1000);
    touchPlaylistAdd('a', 5000);
    expect(getRecentPlaylistAdds().a).toBe(5000);
  });

  it('ignores a blank id', () => {
    touchPlaylistAdd('', 1000);
    expect(getRecentPlaylistAdds()).toEqual({});
  });

  it('caps the store to the 50 most-recent ids', () => {
    for (let i = 0; i < 60; i++) touchPlaylistAdd(`p${i}`, i);
    const map = getRecentPlaylistAdds();
    expect(Object.keys(map)).toHaveLength(50);
    expect(map.p59).toBe(59); // newest kept
    expect(map.p0).toBeUndefined(); // oldest dropped
  });

  it('tolerates corrupt storage', () => {
    localStorage.setItem('cadence.recent-playlist-adds', '{not json');
    expect(getRecentPlaylistAdds()).toEqual({});
  });
});
