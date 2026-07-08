import { useCallback, useState } from 'react';
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
  type RecentItem,
} from './recentSearchStore';

/** Reactive access to the recent-searches list + record/remove/clear actions. */
export function useRecentSearches() {
  const [recents, setRecents] = useState<RecentItem[]>(getRecentSearches);
  const record = useCallback((item: RecentItem) => setRecents(addRecentSearch(item)), []);
  const remove = useCallback((id: string) => setRecents(removeRecentSearch(id)), []);
  const clear = useCallback(() => setRecents(clearRecentSearches()), []);
  return { recents, record, remove, clear };
}
