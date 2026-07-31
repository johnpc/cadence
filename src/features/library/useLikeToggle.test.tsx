import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('../../lib/jellyfinItems', () => ({ addFavorite: vi.fn(), removeFavorite: vi.fn() }));
import { addFavorite, removeFavorite } from '../../lib/jellyfinItems';
import { useLikeToggle } from './useLikeToggle';
import { ToastContext } from '../toast/ToastContext';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const toast = vi.fn();
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
  </QueryClientProvider>
);

// A wrapper exposing its QueryClient so a test can spy on invalidateQueries.
function spyWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const spy = vi.spyOn(client, 'invalidateQueries');
  const w = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
    </QueryClientProvider>
  );
  return { w, spy };
}

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

  it('rolls back AND toasts on error', async () => {
    vi.mocked(addFavorite).mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useLikeToggle(track(false)), { wrapper });
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.liked).toBe(false)); // rolled back
    expect(toast).toHaveBeenCalledWith("Couldn't save to Liked Songs");
  });

  it('invalidates the audiobook favorites + library on success (heart shows immediately)', async () => {
    // A liked item can be an audiobook — the "favorites" section must refresh, not
    // wait for an app reload. So the like invalidates the audiobook queries too.
    vi.mocked(addFavorite).mockResolvedValue();
    const { w, spy } = spyWrapper();
    const { result } = renderHook(() => useLikeToggle(track(false)), { wrapper: w });
    act(() => result.current.toggle());
    await waitFor(() => expect(addFavorite).toHaveBeenCalled());
    const keys = spy.mock.calls.map((c) => JSON.stringify(c[0]?.queryKey));
    expect(keys).toContain(JSON.stringify(['audiobooks-favorites']));
    expect(keys).toContain(JSON.stringify(['audiobooks']));
  });
});
