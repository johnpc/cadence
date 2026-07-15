import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useDeezerMissing } from './useDeezerMissing';
import * as api from './deezerSubscriptionApi';
import * as missing from './requestMissingArtist';
import * as runtimeConfig from '../../lib/runtimeConfig';

vi.mock('../toast/useToast', () => ({ useToast: () => vi.fn() }));

afterEach(() => {
  vi.restoreAllMocks();
});

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('useDeezerMissing', () => {
  it('exposes the fetched missing artists when Deezer import is enabled', async () => {
    vi.spyOn(runtimeConfig, 'deezerImportEnabled').mockReturnValue(true);
    vi.spyOn(api, 'getDeezerSubscription').mockResolvedValue({
      DeezerPlaylistId: '1',
      MissingArtists: ['The Beatles', 'Louis Armstrong'],
    });
    const { result } = renderHook(() => useDeezerMissing('pl1'), { wrapper });
    await waitFor(() => expect(result.current.missing).toHaveLength(2));
  });

  it('does not query when Deezer import is disabled', async () => {
    vi.spyOn(runtimeConfig, 'deezerImportEnabled').mockReturnValue(false);
    const spy = vi.spyOn(api, 'getDeezerSubscription').mockResolvedValue(null);
    const { result } = renderHook(() => useDeezerMissing('pl1'), { wrapper });
    expect(result.current.missing).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it('marks an artist requested on success', async () => {
    vi.spyOn(runtimeConfig, 'deezerImportEnabled').mockReturnValue(true);
    vi.spyOn(api, 'getDeezerSubscription').mockResolvedValue({
      DeezerPlaylistId: '1',
      MissingArtists: ['The Beatles'],
    });
    vi.spyOn(missing, 'requestMissingArtist').mockResolvedValue();
    const { result } = renderHook(() => useDeezerMissing('pl1'), { wrapper });
    await act(async () => {
      await result.current.request('The Beatles');
    });
    expect(result.current.status['The Beatles']).toBe('requested');
  });

  it('marks an artist errored on failure', async () => {
    vi.spyOn(runtimeConfig, 'deezerImportEnabled').mockReturnValue(true);
    vi.spyOn(api, 'getDeezerSubscription').mockResolvedValue(null);
    vi.spyOn(missing, 'requestMissingArtist').mockRejectedValue(new Error('x'));
    const { result } = renderHook(() => useDeezerMissing('pl1'), { wrapper });
    await act(async () => {
      await result.current.request('Nobody');
    });
    expect(result.current.status['Nobody']).toBe('error');
  });
});
