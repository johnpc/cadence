import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('../../lib/jellyfinItems', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }));
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { useSaveToggle } from './useSaveToggle';
import { ToastContext } from '../toast/ToastContext';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const toast = vi.fn();
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
  </QueryClientProvider>
);

const album = (fav: boolean): JellyfinItem => ({
  Id: 'al1',
  Name: 'x',
  Type: 'MusicAlbum',
  UserData: { IsFavorite: fav },
});

describe('useSaveToggle', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('seeds from the item favorite state', () => {
    const { result } = renderHook(() => useSaveToggle(album(true)), { wrapper });
    expect(result.current.saved).toBe(true);
  });

  it('saves an unsaved album (optimistic + server call)', async () => {
    vi.mocked(addFavorite).mockResolvedValue();
    const { result } = renderHook(() => useSaveToggle(album(false)), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.saved).toBe(true);
    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith('al1'));
  });

  it('unsaves a saved album', async () => {
    vi.mocked(removeFavorite).mockResolvedValue();
    const { result } = renderHook(() => useSaveToggle(album(true)), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.saved).toBe(false);
    await waitFor(() => expect(removeFavorite).toHaveBeenCalledWith('al1'));
  });

  it('rolls back AND toasts on error', async () => {
    vi.mocked(addFavorite).mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useSaveToggle(album(false)), { wrapper });
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.saved).toBe(false));
    expect(toast).toHaveBeenCalledWith("Couldn't add to your library");
  });

  it('is disabled semantics for a null item (no crash)', () => {
    const { result } = renderHook(() => useSaveToggle(null), { wrapper });
    expect(result.current.saved).toBe(false);
  });
});
