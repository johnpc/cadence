import { afterEach, describe, expect, it } from 'vitest';
import { getCachedPlaylistItems, setCachedPlaylistItems } from './playlistItemsCache';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

afterEach(() => localStorage.clear());

describe('playlistItemsCache', () => {
  it('returns undefined for an uncached playlist', () => {
    expect(getCachedPlaylistItems('nope')).toBeUndefined();
  });

  it('round-trips a playlist track list through localStorage', () => {
    setCachedPlaylistItems('p1', [track('a'), track('b')]);
    expect(getCachedPlaylistItems('p1')?.map((t) => t.Id)).toEqual(['a', 'b']);
  });

  it('evicts the oldest entries past the cap (30)', () => {
    for (let i = 0; i < 35; i++) setCachedPlaylistItems(`p${i}`, [track(`t${i}`)]);
    // The first few (oldest) should have been evicted; the newest survive.
    expect(getCachedPlaylistItems('p0')).toBeUndefined();
    expect(getCachedPlaylistItems('p34')).toBeDefined();
  });

  it('tolerates corrupt storage without throwing', () => {
    localStorage.setItem('cadence.playlist-items', '{not json');
    expect(getCachedPlaylistItems('p1')).toBeUndefined();
  });
});
