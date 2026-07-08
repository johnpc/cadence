import { afterEach, describe, expect, it } from 'vitest';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from './recentSearchStore';

const item = (id: string) => ({ Id: id, Name: `Item ${id}`, Type: 'Audio' as const });

describe('recentSearchStore', () => {
  afterEach(() => localStorage.clear());

  it('starts empty', () => {
    expect(getRecentSearches()).toEqual([]);
  });

  it('prepends items and dedupes by id', () => {
    addRecentSearch(item('a'));
    addRecentSearch(item('b'));
    addRecentSearch(item('a')); // moves 'a' to front, no dup
    expect(getRecentSearches().map((i) => i.Id)).toEqual(['a', 'b']);
  });

  it('caps the list at 12', () => {
    for (let i = 0; i < 20; i++) addRecentSearch(item(`t${i}`));
    expect(getRecentSearches()).toHaveLength(12);
    expect(getRecentSearches()[0].Id).toBe('t19');
  });

  it('removes a single entry by id', () => {
    addRecentSearch(item('a'));
    addRecentSearch(item('b'));
    expect(removeRecentSearch('a').map((i) => i.Id)).toEqual(['b']);
    expect(getRecentSearches().map((i) => i.Id)).toEqual(['b']);
  });

  it('clears the list', () => {
    addRecentSearch(item('a'));
    expect(clearRecentSearches()).toEqual([]);
    expect(getRecentSearches()).toEqual([]);
  });

  it('tolerates corrupt storage', () => {
    localStorage.setItem('cadence.recent-searches', '{not json');
    expect(getRecentSearches()).toEqual([]);
  });
});
