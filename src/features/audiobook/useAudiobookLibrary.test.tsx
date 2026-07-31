import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('./audiobookLibraryApi', () => ({
  getAudiobooks: vi.fn(),
  getResumableAudiobooks: vi.fn(),
  getFavoriteAudiobooks: vi.fn(),
}));
vi.mock('./audiobookSource', () => ({
  audiobookSourceEnabled: vi.fn(() => false), // default: no plugin → native path
  fetchAudiobookLibrary: vi.fn(),
}));
// Config settled + flag off → useAudiobookSource is inactive, so the native scan
// runs (the path these tests exercise). Plugin-path tests flip the flag.
vi.mock('../../lib/pluginConfigStore', () => ({ usePluginConfigHydrated: () => true }));
import {
  getAudiobooks,
  getResumableAudiobooks,
  getFavoriteAudiobooks,
} from './audiobookLibraryApi';
import { audiobookSourceEnabled, fetchAudiobookLibrary } from './audiobookSource';
import { useAudiobookLibrary } from './useAudiobookLibrary';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const S = 10_000_000;
const book = (id: string, userData?: JellyfinItem['UserData']): JellyfinItem =>
  ({ Id: id, Name: id, Type: 'AudioBook', UserData: userData }) as JellyfinItem;

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('useAudiobookLibrary (native path)', () => {
  it('returns the books and merged highlights (resumable + favorites, deduped)', async () => {
    vi.mocked(getAudiobooks).mockResolvedValue([book('Dune'), book('Sapiens')]);
    vi.mocked(getResumableAudiobooks).mockResolvedValue([book('Dune')]);
    vi.mocked(getFavoriteAudiobooks).mockResolvedValue([book('Dune'), book('Sapiens')]);
    const { result } = renderHook(() => useAudiobookLibrary(), { wrapper });
    await waitFor(() => expect(result.current.books).toHaveLength(2));
    // Dune (resumable) first, Sapiens (favorite) next, Dune not duplicated.
    await waitFor(() =>
      expect(result.current.highlights.map((b) => b.Id)).toEqual(['Dune', 'Sapiens']),
    );
    expect(result.current.isError).toBe(false);
  });

  it('surfaces an error from the books query', async () => {
    vi.mocked(getAudiobooks).mockRejectedValue(new Error('boom'));
    vi.mocked(getResumableAudiobooks).mockResolvedValue([]);
    vi.mocked(getFavoriteAudiobooks).mockResolvedValue([]);
    const { result } = renderHook(() => useAudiobookLibrary(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.books).toEqual([]);
  });
});

describe('useAudiobookLibrary (plugin fast path)', () => {
  it('uses the cached library and does NOT run the native scan', async () => {
    vi.mocked(audiobookSourceEnabled).mockReturnValue(true);
    vi.mocked(fetchAudiobookLibrary).mockResolvedValue([book('Dune'), book('Sapiens')]);
    vi.mocked(getResumableAudiobooks).mockResolvedValue([]);
    vi.mocked(getFavoriteAudiobooks).mockResolvedValue([]);
    const { result } = renderHook(() => useAudiobookLibrary(), { wrapper });
    await waitFor(() => expect(result.current.books).toHaveLength(2));
    expect(getAudiobooks).not.toHaveBeenCalled(); // native scan skipped
  });

  it('overlays LIVE progress from highlights onto the cached catalog', async () => {
    // Cached copy has stale progress; the resumable (live) query has fresh progress.
    vi.mocked(audiobookSourceEnabled).mockReturnValue(true);
    vi.mocked(fetchAudiobookLibrary).mockResolvedValue([
      book('Dune', { PlaybackPositionTicks: 10 * S }),
    ]);
    vi.mocked(getResumableAudiobooks).mockResolvedValue([
      book('Dune', { PlaybackPositionTicks: 900 * S }),
    ]);
    vi.mocked(getFavoriteAudiobooks).mockResolvedValue([]);
    const { result } = renderHook(() => useAudiobookLibrary(), { wrapper });
    await waitFor(() =>
      expect(result.current.books[0]?.UserData?.PlaybackPositionTicks).toBe(900 * S),
    );
  });

  it('falls back to the native scan when the plugin call errors (503 cold miss)', async () => {
    vi.mocked(audiobookSourceEnabled).mockReturnValue(true);
    vi.mocked(fetchAudiobookLibrary).mockRejectedValue(new Error('503'));
    vi.mocked(getAudiobooks).mockResolvedValue([book('Dune')]);
    vi.mocked(getResumableAudiobooks).mockResolvedValue([]);
    vi.mocked(getFavoriteAudiobooks).mockResolvedValue([]);
    const { result } = renderHook(() => useAudiobookLibrary(), { wrapper });
    await waitFor(() => expect(result.current.books).toHaveLength(1));
    expect(getAudiobooks).toHaveBeenCalled(); // native fallback ran
  });
});
