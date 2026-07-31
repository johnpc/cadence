import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('../../lib/jellyfinItems', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }));
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { usePlaylistFavorite } from './usePlaylistFavorite';
import { ToastContext } from '../toast/ToastContext';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const toast = vi.fn();
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={client}>
    <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
  </QueryClientProvider>
);

const pl = (fav: boolean): JellyfinItem => ({
  Id: 'p1',
  Name: 'Faves',
  Type: 'Playlist',
  UserData: { IsFavorite: fav },
});

describe('usePlaylistFavorite', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('seeds from the playlist favorite state', () => {
    const { result } = renderHook(() => usePlaylistFavorite(pl(true)), { wrapper });
    expect(result.current.favorite).toBe(true);
  });

  it('favorites optimistically and calls the server', async () => {
    vi.mocked(addFavorite).mockResolvedValue();
    const { result } = renderHook(() => usePlaylistFavorite(pl(false)), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.favorite).toBe(true); // optimistic
    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith('p1'));
  });

  it('unfavorites and calls removeFavorite', async () => {
    vi.mocked(removeFavorite).mockResolvedValue();
    const { result } = renderHook(() => usePlaylistFavorite(pl(true)), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.favorite).toBe(false);
    await waitFor(() => expect(removeFavorite).toHaveBeenCalledWith('p1'));
  });

  it('rolls back and toasts on failure', async () => {
    vi.mocked(addFavorite).mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => usePlaylistFavorite(pl(false)), { wrapper });
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.favorite).toBe(false)); // rolled back
    expect(toast).toHaveBeenCalledWith("Couldn't favorite playlist");
  });

  it('no-ops when there is no playlist', () => {
    const { result } = renderHook(() => usePlaylistFavorite(null), { wrapper });
    act(() => result.current.toggle());
    expect(addFavorite).not.toHaveBeenCalled();
    expect(result.current.favorite).toBe(false);
  });
});
