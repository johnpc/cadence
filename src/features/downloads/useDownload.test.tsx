import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('./downloadStore', () => ({
  downloadTrack: vi.fn(),
  removeDownload: vi.fn(),
  isDownloaded: vi.fn(() => false),
}));
vi.mock('../../lib/haptics', () => ({ tap: vi.fn() }));
import { downloadTrack, removeDownload, isDownloaded } from './downloadStore';
import { useDownload } from './useDownload';
import { ToastContext } from '../toast/ToastContext';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const toast = vi.fn();
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
  </QueryClientProvider>
);
const track = { Id: 't1', Name: 'x' } as JellyfinItem;

describe('useDownload', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('seeds from the store state', () => {
    vi.mocked(isDownloaded).mockReturnValue(true);
    const { result } = renderHook(() => useDownload(track), { wrapper });
    expect(result.current.state).toBe('downloaded');
  });

  it('downloads: optimistic downloading → downloaded', async () => {
    vi.mocked(downloadTrack).mockResolvedValue();
    const { result } = renderHook(() => useDownload(track), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.state).toBe('downloading'); // optimistic
    await waitFor(() => expect(result.current.state).toBe('downloaded'));
    expect(downloadTrack).toHaveBeenCalledWith(track);
  });

  it('rolls back to none AND toasts on download error', async () => {
    vi.mocked(downloadTrack).mockRejectedValue(new Error('nope'));
    const { result } = renderHook(() => useDownload(track), { wrapper });
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.state).toBe('none'));
    expect(toast).toHaveBeenCalledWith("Couldn't download this track");
  });

  it('removes a downloaded track', async () => {
    vi.mocked(isDownloaded).mockReturnValue(true);
    vi.mocked(removeDownload).mockResolvedValue();
    const { result } = renderHook(() => useDownload(track), { wrapper });
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.state).toBe('none'));
    expect(removeDownload).toHaveBeenCalledWith('t1');
  });

  it('does nothing while downloading (no double-fire)', async () => {
    vi.mocked(downloadTrack).mockResolvedValue();
    const { result } = renderHook(() => useDownload(track), { wrapper });
    act(() => result.current.toggle());
    act(() => result.current.toggle()); // second tap mid-flight
    await waitFor(() => expect(result.current.state).toBe('downloaded'));
    expect(downloadTrack).toHaveBeenCalledOnce();
  });
});
