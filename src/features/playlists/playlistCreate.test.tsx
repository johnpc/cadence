import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('../../lib/jellyfinPlaylists', () => ({
  createPlaylist: vi.fn(),
  createPlaylistWithItems: vi.fn(),
  getPlaylistItems: vi.fn(),
}));
import {
  createPlaylist,
  createPlaylistWithItems,
  getPlaylistItems,
} from '../../lib/jellyfinPlaylists';
import { useCreatePlaylist, useCreatePlaylistWithItems, useClonePlaylist } from './playlistCreate';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

afterEach(() => {
  vi.resetAllMocks();
});

describe('playlistCreate', () => {
  it('useCreatePlaylist creates a named playlist', async () => {
    vi.mocked(createPlaylist).mockResolvedValue('p1');
    const { result } = renderHook(() => useCreatePlaylist(), { wrapper });
    result.current.mutate('My Mix');
    await waitFor(() => expect(createPlaylist).toHaveBeenCalledWith('My Mix'));
  });

  it('useCreatePlaylistWithItems creates a playlist pre-filled with tracks', async () => {
    vi.mocked(createPlaylistWithItems).mockResolvedValue('q1');
    const { result } = renderHook(() => useCreatePlaylistWithItems(), { wrapper });
    result.current.mutate({ name: 'Saved Queue', itemIds: ['a', 'b'] });
    await waitFor(() =>
      expect(createPlaylistWithItems).toHaveBeenCalledWith('Saved Queue', ['a', 'b']),
    );
  });

  it('useClonePlaylist copies a source playlist’s tracks into a new owned one', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue([
      { Id: 't1', Name: 'One', Type: 'Audio' },
      { Id: 't2', Name: 'Two', Type: 'Audio' },
    ]);
    vi.mocked(createPlaylistWithItems).mockResolvedValue('clone1');
    const { result } = renderHook(() => useClonePlaylist(), { wrapper });
    result.current.mutate({ sourceId: 'src', name: 'Community Mix (copy)' });
    await waitFor(() => expect(getPlaylistItems).toHaveBeenCalledWith('src'));
    await waitFor(() =>
      expect(createPlaylistWithItems).toHaveBeenCalledWith('Community Mix (copy)', ['t1', 't2']),
    );
  });
});
