import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('../../lib/jellyfinItems', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }));
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { useLikeToggle } from './useLikeToggle';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {children}
  </QueryClientProvider>
);

const track = (fav: boolean): JellyfinItem => ({
  Id: 't1',
  Name: 'x',
  Type: 'Audio',
  UserData: { IsFavorite: fav },
});

describe('useLikeToggle', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('seeds from the item favorite state', () => {
    const { result } = renderHook(() => useLikeToggle(track(true)), { wrapper });
    expect(result.current.liked).toBe(true);
  });

  it('likes an unliked track (optimistic + server call)', async () => {
    vi.mocked(addFavorite).mockResolvedValue();
    const { result } = renderHook(() => useLikeToggle(track(false)), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.liked).toBe(true); // optimistic
    await waitFor(() => expect(addFavorite).toHaveBeenCalledWith('t1'));
  });

  it('unlikes a liked track', async () => {
    vi.mocked(removeFavorite).mockResolvedValue();
    const { result } = renderHook(() => useLikeToggle(track(true)), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.liked).toBe(false);
    await waitFor(() => expect(removeFavorite).toHaveBeenCalledWith('t1'));
  });

  it('rolls back on error', async () => {
    vi.mocked(addFavorite).mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useLikeToggle(track(false)), { wrapper });
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.liked).toBe(false)); // rolled back
  });
});
