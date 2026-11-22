import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./storytellerApi', () => ({ getReadAlongBook: vi.fn(), getChapterText: vi.fn() }));
import { getChapterText, getReadAlongBook } from './storytellerApi';
import { useChapterText, useReadAlongBook } from './useReadAlong';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('useReadAlongBook', () => {
  it('reports a failed fetch as isError', async () => {
    vi.mocked(getReadAlongBook).mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useReadAlongBook('p2', true), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it('does not fetch until enabled with an item', () => {
    const { result } = renderHook(() => useReadAlongBook('p1', false), { wrapper });
    expect(getReadAlongBook).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it('fetches the book', async () => {
    vi.mocked(getReadAlongBook).mockResolvedValue({ Status: 'ready' } as never);
    const { result } = renderHook(() => useReadAlongBook('p1', true), { wrapper });
    await waitFor(() => expect(result.current.book?.Status).toBe('ready'));
    expect(result.current.isError).toBe(false);
  });
});

describe('useChapterText', () => {
  it('fetches only with an href', async () => {
    vi.mocked(getChapterText).mockResolvedValue('<p id="s1">x</p>');
    const idle = renderHook(() => useChapterText('p1', null), { wrapper });
    expect(idle.result.current.isLoading).toBe(false);
    const { result } = renderHook(() => useChapterText('p1', 'ch.xhtml'), { wrapper });
    await waitFor(() => expect(result.current.html).toBe('<p id="s1">x</p>'));
    expect(getChapterText).toHaveBeenCalledWith('p1', 'ch.xhtml');
  });
});
