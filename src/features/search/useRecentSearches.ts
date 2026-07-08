import { useCallback, useState } from 'react';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  type RecentItem,
} from './recentSearchStore';

/** Reactive access to the recent-searches list + record/clear actions. */
export function useRecentSearches() {
  const [recents, setRecents] = useState<RecentItem[]>(getRecentSearches);
  const record = useCallback((item: RecentItem) => setRecents(addRecentSearch(item)), []);
  const clear = useCallback(() => setRecents(clearRecentSearches()), []);
  return { recents, record, clear };
}
