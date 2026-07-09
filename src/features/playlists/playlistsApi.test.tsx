import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('../../lib/jellyfinPlaylists', () => ({
  getPlaylists: vi.fn(),
  getPlaylistItems: vi.fn(),
  createPlaylist: vi.fn(),
  createPlaylistWithItems: vi.fn(),
  addToPlaylist: vi.fn(),
  removeFromPlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  renamePlaylist: vi.fn(),
}));
import {
  addToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistItems,
  getPlaylists,
  removeFromPlaylist,
  renamePlaylist,
} from '../../lib/jellyfinPlaylists';
import {
  useAddToPlaylist,
  useDeletePlaylist,
  useRemoveFromPlaylist,
  useRenamePlaylist,
  usePlaylistItems,
  usePlaylists,
} from './playlistsApi';
import { useCreatePlaylist } from './playlistCreate';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);
const pl: JellyfinItem = { Id: 'p', Name: 'PL', Type: 'Playlist' };

describe('playlistsApi', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('usePlaylists returns the playlists', async () => {
    vi.mocked(getPlaylists).mockResolvedValue([pl]);
    const { result } = renderHook(() => usePlaylists(), { wrapper });
    await waitFor(() => expect(result.current.playlists).toHaveLength(1));
  });

  it('usePlaylistItems returns a playlist’s tracks', async () => {
    vi.mocked(getPlaylistItems).mockResolvedValue([{ Id: 'a', Name: 'x', Type: 'Audio' }]);
    const { result } = renderHook(() => usePlaylistItems('p'), { wrapper });
    await waitFor(() => expect(result.current.tracks).toHaveLength(1));
  });

  it('useCreatePlaylist creates a playlist', async () => {
    vi.mocked(createPlaylist).mockResolvedValue('new1');
    const { result } = renderHook(() => useCreatePlaylist(), { wrapper });
    result.current.mutate('Mix');
    await waitFor(() => expect(createPlaylist).toHaveBeenCalledWith('Mix'));
  });

  it('useAddToPlaylist adds a track', async () => {
    vi.mocked(addToPlaylist).mockResolvedValue();
    const { result } = renderHook(() => useAddToPlaylist(), { wrapper });
    result.current.mutate({ playlistId: 'p', itemId: 's' });
    await waitFor(() => expect(addToPlaylist).toHaveBeenCalledWith('p', 's'));
  });

  it('useRemoveFromPlaylist removes an entry', async () => {
    vi.mocked(removeFromPlaylist).mockResolvedValue();
    const { result } = renderHook(() => useRemoveFromPlaylist('p'), { wrapper });
    result.current.mutate('entry1');
    await waitFor(() => expect(removeFromPlaylist).toHaveBeenCalledWith('p', 'entry1'));
  });

  it('useDeletePlaylist deletes a playlist', async () => {
    vi.mocked(deletePlaylist).mockResolvedValue();
    const { result } = renderHook(() => useDeletePlaylist(), { wrapper });
    result.current.mutate('p');
    await waitFor(() => expect(deletePlaylist).toHaveBeenCalledWith('p'));
  });

  it('useRenamePlaylist renames a playlist', async () => {
    vi.mocked(renamePlaylist).mockResolvedValue();
    const { result } = renderHook(() => useRenamePlaylist('p'), { wrapper });
    result.current.mutate('New Name');
    await waitFor(() => expect(renamePlaylist).toHaveBeenCalledWith('p', 'New Name'));
  });
});
