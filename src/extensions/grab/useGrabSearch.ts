import { useState } from 'react';
import { grabSearch } from './grabClient';
import type { GrabResult } from './grabTypes';

/** Runs a Music Grabber search on demand (not react-query — it's a slow,
 * explicitly-triggered action, not cached page data). Filters out playlist
 * results for the single-track UX and exposes the search_token needed to
 * download. Tracks loading + error so the sheet can render states. */
export function useGrabSearch() {
  const [results, setResults] = useState<GrabResult[]>([]);
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [searched, setSearched] = useState(false);

  const run = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(false);
    setSearched(true);
    try {
      const res = await grabSearch(q);
      setResults(res.results.filter((r) => !r.is_playlist));
      setToken(res.search_token);
    } catch {
      setError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return { results, token, loading, error, searched, run };
}
