import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./storytellerApi', () => ({ getReadAlongLibrary: vi.fn() }));
vi.mock('../../lib/runtimeConfig', () => ({ storytellerEnabled: vi.fn() }));
import { getReadAlongLibrary } from './storytellerApi';
import { storytellerEnabled } from '../../lib/runtimeConfig';
import { useReadAlongLibrary, useReadAlongStatus } from './useReadAlongLibrary';

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('useReadAlongLibrary', () => {
  it('never asks a server without a Storyteller bridge', () => {
    vi.mocked(storytellerEnabled).mockReturnValue(false);
    const { result } = renderHook(() => useReadAlongLibrary(), { wrapper });
    expect(getReadAlongLibrary).not.toHaveBeenCalled();
    expect(result.current.ready).toBe(0);
  });

  it('indexes the list and answers per book', async () => {
    vi.mocked(storytellerEnabled).mockReturnValue(true);
    vi.mocked(getReadAlongLibrary).mockResolvedValue({
      Status: 'ok',
      Books: [{ ItemId: 'p1', Status: 'ready' }],
    });
    const { result } = renderHook(
      () => ({
        index: useReadAlongLibrary(),
        status: useReadAlongStatus({ id: 'p1', parts: [{ Id: 'p1' }] }),
      }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.index.ready).toBe(1);
  });
});
