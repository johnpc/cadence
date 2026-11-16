import { useRef, useState } from 'react';
import { grabSearch } from './grabClient';
import type { GrabResult } from './grabTypes';

/** The search's ONE state: never searched, searching, failed, or showing results. */
export type GrabSearchState =
  | { kind: 'idle' }
  | { kind: 'searching' }
  | { kind: 'error' }
  | { kind: 'results'; results: GrabResult[]; token: string };

/** Runs a Music Grabber search on demand (not react-query — it's a slow,
 * explicitly-triggered action, not cached page data). Filters out playlist
 * results for the single-track UX and exposes the search_token needed to
 * download. Only the LATEST search may land: a slow earlier one that answers
 * after a newer query is dropped instead of overwriting its results. */
export function useGrabSearch() {
  const [state, setState] = useState<GrabSearchState>({ kind: 'idle' });
  const latest = useRef(0);

  const run = async (query: string) => {
    const q = query.trim();
    if (!q) return;
    const id = ++latest.current;
    setState({ kind: 'searching' });
    try {
      const res = await grabSearch(q);
      if (id !== latest.current) return;
      setState({
        kind: 'results',
        results: res.results.filter((r) => !r.is_playlist),
        token: res.search_token,
      });
    } catch {
      if (id === latest.current) setState({ kind: 'error' });
    }
  };

  return {
    state,
    results: state.kind === 'results' ? state.results : [],
    token: state.kind === 'results' ? state.token : '',
    loading: state.kind === 'searching',
    error: state.kind === 'error',
    searched: state.kind !== 'idle',
    run,
  };
}
