import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinItems', () => ({ getItem: vi.fn() }));
vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn(),
  getPlaylistItems: vi.fn(),
}));
import { getItem } from '../../lib/jellyfinItems';
import { getPlaylists, getPlaylistItems } from '../../lib/jellyfinPlaylists';
import { useSong, useSongPlaylists } from './songApi';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

const track: JellyfinItem = { Id: 's1', Name: 'A Song', Type: 'Audio' };

afterEach(() => {
  vi.resetAllMocks();
});

describe('useSong', () => {
  it('returns the fetched track', async () => {
    vi.mocked(getItem).mockResolvedValue(track);
    const { result } = renderHook(() => useSong('s1'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.song).toEqual(track));
    expect(result.current.isError).toBe(false);
  });

  it('surfaces errors', async () => {
    vi.mocked(getItem).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useSong('s1'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.song).toBeNull();
  });
});

describe('useSongPlaylists', () => {
  it('keeps only playlists whose items include the song', async () => {
    vi.mocked(getPlaylists).mockResolvedValue([
      { Id: 'p1', Name: 'Has it', Type: 'Playlist' },
      { Id: 'p2', Name: 'Missing', Type: 'Playlist' },
    ]);
    vi.mocked(getPlaylistItems).mockImplementation(async (id: string) =>
      id === 'p1' ? [track] : [{ Id: 'other', Name: 'x', Type: 'Audio' }],
    );
    const { result } = renderHook(() => useSongPlaylists('s1'), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.playlists).toHaveLength(1));
    expect(result.current.playlists[0].Name).toBe('Has it');
  });

  it('tolerates a playlist that fails to load', async () => {
    vi.mocked(getPlaylists).mockResolvedValue([{ Id: 'p1', Name: 'Broken', Type: 'Playlist' }]);
    vi.mocked(getPlaylistItems).mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useSongPlaylists('s1'), { wrapper: wrapper() });
    await waitFor(() => expect(getPlaylistItems).toHaveBeenCalled());
    expect(result.current.playlists).toEqual([]);
  });
});
