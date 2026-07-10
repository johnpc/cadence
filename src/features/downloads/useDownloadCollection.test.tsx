import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

let fire: () => void = () => {};
vi.mock('./downloadStore', () => ({
  downloadTrack: vi.fn().mockResolvedValue(undefined),
  removeDownload: vi.fn().mockResolvedValue(undefined),
  onDownloadsChange: (l: () => void) => {
    fire = l;
    return () => {};
  },
}));
vi.mock('./downloadIndex', () => ({ indexedIds: vi.fn(() => new Set<string>()) }));
vi.mock('../../lib/haptics', () => ({ tap: vi.fn() }));
import { downloadTrack, removeDownload } from './downloadStore';
import { indexedIds } from './downloadIndex';
import { useDownloadCollection } from './useDownloadCollection';
import { ToastContext } from '../toast/ToastContext';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const toast = vi.fn();
const wrapper = ({ children }: { children: ReactNode }) => (
  <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
);
const tracks: JellyfinItem[] = [
  { Id: 'a', Name: 'A' } as JellyfinItem,
  { Id: 'b', Name: 'B' } as JellyfinItem,
  { Id: 'c', Name: 'C' } as JellyfinItem,
];

describe('useDownloadCollection', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.mocked(indexedIds).mockReturnValue(new Set());
  });

  it('is "none" when no track is downloaded', () => {
    const { result } = renderHook(() => useDownloadCollection(tracks), { wrapper });
    expect(result.current.state).toBe('none');
  });

  it('is "partial" when some tracks are downloaded', () => {
    vi.mocked(indexedIds).mockReturnValue(new Set(['a']));
    const { result } = renderHook(() => useDownloadCollection(tracks), { wrapper });
    expect(result.current.state).toBe('partial');
  });

  it('is "downloaded" when every track is downloaded', () => {
    vi.mocked(indexedIds).mockReturnValue(new Set(['a', 'b', 'c']));
    const { result } = renderHook(() => useDownloadCollection(tracks), { wrapper });
    expect(result.current.state).toBe('downloaded');
  });

  it('downloadAll fetches only the missing tracks and toasts', async () => {
    vi.mocked(indexedIds).mockReturnValue(new Set(['a'])); // 'a' already saved
    const { result } = renderHook(() => useDownloadCollection(tracks), { wrapper });
    await act(async () => {
      await result.current.downloadAll();
    });
    expect(downloadTrack).toHaveBeenCalledTimes(2); // b, c only
    expect(toast).toHaveBeenCalledWith('Downloaded');
  });

  it('reports a partial count when some downloads fail', async () => {
    vi.mocked(downloadTrack).mockImplementation((t: JellyfinItem) =>
      t.Id === 'b' ? Promise.reject(new Error('nope')) : Promise.resolve(),
    );
    const { result } = renderHook(() => useDownloadCollection(tracks), { wrapper });
    await act(async () => {
      await result.current.downloadAll();
    });
    expect(toast).toHaveBeenCalledWith('Downloaded 2 of 3');
  });

  it('removeAll removes every track', async () => {
    vi.mocked(indexedIds).mockReturnValue(new Set(['a', 'b', 'c']));
    const { result } = renderHook(() => useDownloadCollection(tracks), { wrapper });
    await act(async () => {
      await result.current.removeAll();
    });
    expect(removeDownload).toHaveBeenCalledTimes(3);
    expect(toast).toHaveBeenCalledWith('Removed downloads');
  });

  it('recomputes state when the store emits a change', () => {
    const { result } = renderHook(() => useDownloadCollection(tracks), { wrapper });
    expect(result.current.state).toBe('none');
    vi.mocked(indexedIds).mockReturnValue(new Set(['a', 'b', 'c']));
    act(() => fire());
    expect(result.current.state).toBe('downloaded');
  });
});
