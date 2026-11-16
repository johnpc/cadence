import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

// A fake of the shared download stores: one state per track id + listeners, so
// tests drive state the way downloadTrack/removeDownload really publish it.
const states = new Map<string, 'none' | 'downloading' | 'downloaded'>();
const listeners = new Set<() => void>();
const publish = (id: string, s: 'none' | 'downloading' | 'downloaded') => {
  states.set(id, s);
  listeners.forEach((l) => l());
};
vi.mock('./downloadStore', () => ({
  downloadTrack: vi.fn(),
  removeDownload: vi.fn(),
  trackDownloadState: (id: string) => states.get(id) ?? 'none',
  onDownloadStateChange: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
}));
vi.mock('../../lib/haptics', () => ({ tap: vi.fn() }));
import { downloadTrack, removeDownload } from './downloadStore';
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

/** downloadTrack as the real store behaves: in flight, then downloaded/failed. */
function realisticDownload(outcome: 'ok' | 'fail') {
  let settle!: () => void;
  vi.mocked(downloadTrack).mockImplementation((t) => {
    publish(t.Id, 'downloading');
    return new Promise<void>((resolve, reject) => {
      settle = () => {
        publish(t.Id, outcome === 'ok' ? 'downloaded' : 'none');
        if (outcome === 'ok') resolve();
        else reject(new Error('nope'));
      };
    });
  });
  return () => act(() => settle());
}

describe('useDownload', () => {
  afterEach(() => {
    vi.resetAllMocks();
    states.clear();
    listeners.clear();
  });

  it('reads the shared state', () => {
    states.set('t1', 'downloaded');
    const { result } = renderHook(() => useDownload(track), { wrapper });
    expect(result.current.state).toBe('downloaded');
  });

  it('downloads: downloading (busy) → downloaded', async () => {
    const finish = realisticDownload('ok');
    const { result } = renderHook(() => useDownload(track), { wrapper });
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.state).toBe('downloading'));
    expect(result.current.busy).toBe(true);
    await finish();
    await waitFor(() => expect(result.current.state).toBe('downloaded'));
    expect(downloadTrack).toHaveBeenCalledWith(track);
  });

  it('returns to none AND toasts on download error', async () => {
    const fail = realisticDownload('fail');
    const { result } = renderHook(() => useDownload(track), { wrapper });
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.state).toBe('downloading'));
    await fail();
    await waitFor(() => expect(result.current.state).toBe('none'));
    expect(toast).toHaveBeenCalledWith("Couldn't download this track");
  });

  it('removes a downloaded track', async () => {
    states.set('t1', 'downloaded');
    vi.mocked(removeDownload).mockImplementation(async (id) => publish(id, 'none'));
    const { result } = renderHook(() => useDownload(track), { wrapper });
    act(() => result.current.toggle());
    await waitFor(() => expect(result.current.state).toBe('none'));
    expect(removeDownload).toHaveBeenCalledWith('t1');
  });

  it('toasts when a removal fails', async () => {
    states.set('t1', 'downloaded');
    vi.mocked(removeDownload).mockRejectedValue(new Error('io'));
    const { result } = renderHook(() => useDownload(track), { wrapper });
    act(() => result.current.toggle());
    await waitFor(() => expect(toast).toHaveBeenCalledWith("Couldn't remove this download"));
  });

  it('a button mounted mid-download shows it downloading and does not start another', () => {
    states.set('t1', 'downloading'); // started on another screen / before a remount
    const { result } = renderHook(() => useDownload(track), { wrapper });
    expect(result.current.state).toBe('downloading');
    act(() => result.current.toggle());
    expect(downloadTrack).not.toHaveBeenCalled();
  });

  it('repaints when the track is downloaded elsewhere (e.g. Download all)', () => {
    const { result } = renderHook(() => useDownload(track), { wrapper });
    expect(result.current.state).toBe('none');
    act(() => publish('t1', 'downloaded'));
    expect(result.current.state).toBe('downloaded');
  });

  it('follows the track prop under a mounted hook', () => {
    states.set('t2', 'downloaded');
    const { result, rerender } = renderHook(({ t }) => useDownload(t), {
      wrapper,
      initialProps: { t: track },
    });
    expect(result.current.state).toBe('none');
    rerender({ t: { Id: 't2', Name: 'y' } as JellyfinItem });
    expect(result.current.state).toBe('downloaded');
  });
});
