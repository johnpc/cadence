import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('../../lib/jellyfinPlaylists', () => ({
  createPlaylist: vi.fn(),
  createPlaylistWithItems: vi.fn(),
}));
import { createPlaylist, createPlaylistWithItems } from '../../lib/jellyfinPlaylists';
import { useCreatePlaylist, useCreatePlaylistWithItems } from './playlistCreate';

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
});
