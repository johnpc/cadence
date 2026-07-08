/**
 * Pure localStorage persistence for recently-tapped search results, so the
 * Search tab shows something useful before the user types (like Spotify). Each
 * entry is the minimal item shape needed to render + re-navigate.
 */
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const KEY = 'cadence.recent-searches';
const MAX = 12;

export type RecentItem = Pick<JellyfinItem, 'Id' | 'Name' | 'Type' | 'AlbumId' | 'AlbumArtist'> & {
  Artists?: string[];
};

export function getRecentSearches(): RecentItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as RecentItem[]) : [];
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.Id && i.Name) : [];
  } catch {
    return [];
  }
}

/** Prepend an item (deduped by Id), cap the list, and persist. Returns the new list. */
export function addRecentSearch(item: RecentItem): RecentItem[] {
  const entry: RecentItem = {
    Id: item.Id,
    Name: item.Name,
    Type: item.Type,
    AlbumId: item.AlbumId,
    AlbumArtist: item.AlbumArtist,
    Artists: item.Artists,
  };
  const next = [entry, ...getRecentSearches().filter((i) => i.Id !== entry.Id)].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearRecentSearches(): RecentItem[] {
  localStorage.removeItem(KEY);
  return [];
}
