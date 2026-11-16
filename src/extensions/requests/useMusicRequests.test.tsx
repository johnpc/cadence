import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lidarrApi', async (importActual) => ({
  // Keep the real AlreadyAddedError class so `instanceof` checks work; mock the fns.
  ...(await importActual<typeof import('./lidarrApi')>()),
  searchArtists: vi.fn(),
  getAddDefaults: vi.fn(),
  requestArtist: vi.fn(),
  getLibraryArtistIds: vi.fn().mockResolvedValue(new Set<string>()),
}));
vi.mock('../toast/useToast', () => ({ useToast: () => vi.fn() }));
import {
  searchArtists,
  getAddDefaults,
  requestArtist,
  getLibraryArtistIds,
  AlreadyAddedError,
} from './lidarrApi';
import { useMusicRequests } from './useMusicRequests';
import type { LidarrArtist } from './lidarrTypes';

const artist: LidarrArtist = { artistName: 'Radiohead', foreignArtistId: 'mb-1' };

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('useMusicRequests', () => {
  it('searches (debounced) and exposes results', async () => {
    vi.mocked(searchArtists).mockResolvedValue([artist]);
    const { result } = renderHook(() => useMusicRequests(), { wrapper });
    act(() => result.current.setQuery('radiohead'));
    await waitFor(() => expect(result.current.results).toHaveLength(1));
    expect(searchArtists).toHaveBeenCalledWith('radiohead');
  });

  it('inLibrary reflects the artists already in Lidarr', async () => {
    vi.mocked(getLibraryArtistIds).mockResolvedValue(new Set(['mb-1']));
    const { result } = renderHook(() => useMusicRequests(), { wrapper });
    await waitFor(() => expect(result.current.inLibrary('mb-1')).toBe(true));
    expect(result.current.inLibrary('other')).toBe(false);
  });

  it('marks a request "requested" on success', async () => {
    vi.mocked(getAddDefaults).mockResolvedValue({
      rootFolderPath: '/m',
      qualityProfileId: 1,
      metadataProfileId: 1,
    });
    vi.mocked(requestArtist).mockResolvedValue(artist);
    const { result } = renderHook(() => useMusicRequests(), { wrapper });
    await act(async () => {
      await result.current.request(artist);
    });
    expect(result.current.status['mb-1']).toBe('requested');
    expect(requestArtist).toHaveBeenCalled();
  });

  it('marks an already-added artist "requested" (benign), not an error', async () => {
    vi.mocked(getAddDefaults).mockResolvedValue({
      rootFolderPath: '/m',
      qualityProfileId: 1,
      metadataProfileId: 1,
    });
    vi.mocked(requestArtist).mockRejectedValue(new AlreadyAddedError());
    const { result } = renderHook(() => useMusicRequests(), { wrapper });
    await act(async () => {
      await result.current.request(artist);
    });
    expect(result.current.status['mb-1']).toBe('requested');
  });

  it('marks a request "error" on failure', async () => {
    vi.mocked(getAddDefaults).mockRejectedValue(new Error('no profile'));
    const { result } = renderHook(() => useMusicRequests(), { wrapper });
    await act(async () => {
      await result.current.request(artist);
    });
    expect(result.current.status['mb-1']).toBe('error');
  });
});
