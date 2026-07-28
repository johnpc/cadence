import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

vi.mock('./audiobookApi', () => ({ fetchChapters: vi.fn() }));
import { fetchChapters } from './audiobookApi';
import { useChapters } from './useChapters';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = { Id: 'b1', Name: 'Book', Type: 'AudioBook' } as JellyfinItem;
const song = { Id: 's1', Name: 'Song', Type: 'Audio' } as JellyfinItem;

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('useChapters', () => {
  it('fetches chapters for an audiobook', async () => {
    vi.mocked(fetchChapters).mockResolvedValue([{ name: 'One', start: 0 }]);
    const { result } = renderHook(() => useChapters(book), { wrapper });
    await waitFor(() => expect(result.current.chapters).toHaveLength(1));
    expect(fetchChapters).toHaveBeenCalledWith('b1');
  });

  it('does NOT fetch for a music track', () => {
    const { result } = renderHook(() => useChapters(song), { wrapper });
    expect(fetchChapters).not.toHaveBeenCalled();
    expect(result.current.chapters).toEqual([]);
  });

  it('does not fetch for a null item', () => {
    renderHook(() => useChapters(null), { wrapper });
    expect(fetchChapters).not.toHaveBeenCalled();
  });
});
