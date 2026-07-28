import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('./audiobookLibraryApi', () => ({
  getAudiobooks: vi.fn(),
  getResumableAudiobooks: vi.fn(),
}));
import { getAudiobooks, getResumableAudiobooks } from './audiobookLibraryApi';
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
  it('returns the books and the resumable subset', async () => {
    vi.mocked(getAudiobooks).mockResolvedValue([book('Dune'), book('Sapiens')]);
    vi.mocked(getResumableAudiobooks).mockResolvedValue([book('Dune')]);
    const { result } = renderHook(() => useAudiobookLibrary(), { wrapper });
    await waitFor(() => expect(result.current.books).toHaveLength(2));
    await waitFor(() => expect(result.current.resumable).toHaveLength(1));
    expect(result.current.isError).toBe(false);
  });

  it('surfaces an error from the books query', async () => {
    vi.mocked(getAudiobooks).mockRejectedValue(new Error('boom'));
    vi.mocked(getResumableAudiobooks).mockResolvedValue([]);
    const { result } = renderHook(() => useAudiobookLibrary(), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.books).toEqual([]);
  });
});
