import { useState } from 'react';
import { useDebounced } from '../../lib/useDebounced';
import { useSearchResults } from './searchApi';
import { isEmptyGroups, topResult } from './searchGroups';

/** Orchestrates the search box: query state, debounced fetch, grouped results. */
export function useSearch() {
  const [query, setQuery] = useState('');
  const debounced = useDebounced(query, 300);
  const { groups, isLoading, isError, refetch } = useSearchResults(debounced);

  return {
    query,
    setQuery,
    groups,
    isLoading,
    isError,
    refetch,
    /** The best-match result (drives the Top Result card + Enter-to-play). */
    top: topResult(groups, debounced),
    /** True before the user has typed anything. */
    isIdle: debounced.trim().length === 0,
    isEmpty: !isEmptyGroups(groups) ? false : debounced.trim().length > 0,
  };
}
