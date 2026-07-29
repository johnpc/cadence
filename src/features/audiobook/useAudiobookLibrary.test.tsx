import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('./audiobookLibraryApi', () => ({
  getAudiobooks: vi.fn(),
  getResumableAudiobooks: vi.fn(),
  getFavoriteAudiobooks: vi.fn(),
}));
import {
  getAudiobooks,
  getResumableAudiobooks,
  getFavoriteAudiobooks,
} from './audiobookLibraryApi';
import { useAudiobookLibrary } from './useAudiobookLibrary';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = (id: string): JellyfinItem =>
  ({ Id: id, Name: id, Type: 'AudioBook' }) as JellyfinItem;

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('useAudiobookLibrary', () => {
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
