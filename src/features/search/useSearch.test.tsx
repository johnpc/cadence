import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('./searchSource', () => ({ searchSource: vi.fn() }));
import { searchSource } from './searchSource';
import { useSearch } from './useSearch';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const song: JellyfinItem = { Id: 's', Name: 'Song', Type: 'Audio' };

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useSearch', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('is idle with an empty query and does not fetch', () => {
    const { result } = renderHook(() => useSearch(), { wrapper });
    expect(result.current.isIdle).toBe(true);
    expect(searchSource).not.toHaveBeenCalled();
  });

  it('fetches grouped results after the query is set (debounced)', async () => {
    vi.mocked(searchSource).mockResolvedValue([song]);
    const { result } = renderHook(() => useSearch(), { wrapper });
    act(() => result.current.setQuery('song'));
    await waitFor(() => expect(result.current.groups.songs).toHaveLength(1));
    expect(result.current.isIdle).toBe(false);
  });

  it('reports empty for a query with no results', async () => {
    vi.mocked(searchSource).mockResolvedValue([]);
    const { result } = renderHook(() => useSearch(), { wrapper });
    act(() => result.current.setQuery('zzz'));
    await waitFor(() => expect(result.current.isEmpty).toBe(true));
  });
});
