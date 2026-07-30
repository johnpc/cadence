import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./homeSource', () => ({
  homeSourceEnabled: vi.fn(),
  fetchHomeShelves: vi.fn(),
}));
import { homeSourceEnabled, fetchHomeShelves } from './homeSource';
import { useHomeSource } from './useHomeSource';

const EMPTY = {
  latestAlbums: [],
  suggestedSongs: [],
  savedAlbums: [],
  recentlyPlayed: [],
  onRepeat: [],
  followedArtists: [],
};

function setup() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
  return renderHook(() => useHomeSource(), { wrapper });
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('useHomeSource', () => {
  it('is inactive and never fetches when the plugin flag is off', () => {
    vi.mocked(homeSourceEnabled).mockReturnValue(false);
    const { result } = setup();
    expect(result.current.active).toBe(false);
    expect(result.current.data).toBeNull();
    expect(fetchHomeShelves).not.toHaveBeenCalled();
  });

  it('fetches and returns the precomputed shelves when active', async () => {
    vi.mocked(homeSourceEnabled).mockReturnValue(true);
    vi.mocked(fetchHomeShelves).mockResolvedValue({
      ...EMPTY,
      latestAlbums: [{ Id: 'a', Name: 'A', Type: 'MusicAlbum' }],
    });
    const { result } = setup();
    await waitFor(() => expect(result.current.data).not.toBeNull());
    expect(result.current.active).toBe(true);
    expect(result.current.data?.latestAlbums[0].Id).toBe('a');
    expect(result.current.isError).toBe(false);
  });

  it('surfaces null data + isError on failure (so the caller falls back to native)', async () => {
    vi.mocked(homeSourceEnabled).mockReturnValue(true);
    vi.mocked(fetchHomeShelves).mockRejectedValue(new Error('plugin down'));
    const { result } = setup();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('refetch re-runs the query (pull-to-refresh)', async () => {
    vi.mocked(homeSourceEnabled).mockReturnValue(true);
    vi.mocked(fetchHomeShelves).mockResolvedValue(EMPTY);
    const { result } = setup();
    await waitFor(() => expect(result.current.data).not.toBeNull());
    result.current.refetch();
    await waitFor(() => expect(fetchHomeShelves).toHaveBeenCalledTimes(2));
  });
});
