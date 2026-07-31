import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock every sub-hook so we can assert the source-selection logic in isolation.
vi.mock('./homeApi', () => ({
  useLatestAlbums: vi.fn(),
  useSuggestedSongs: vi.fn(),
  useRecentlyPlayed: vi.fn(),
  useOnRepeat: vi.fn(),
  usePublicPlaylists: vi.fn(),
}));
vi.mock('../library/libraryApi', () => ({
  useSavedAlbums: vi.fn(),
  useFollowedArtists: vi.fn(),
}));
vi.mock('./useJumpBackIn', () => ({ useJumpBackIn: vi.fn() }));
vi.mock('./useHomeSource', () => ({ useHomeSource: vi.fn() }));

import * as homeApi from './homeApi';
import * as libApi from '../library/libraryApi';
import { useJumpBackIn } from './useJumpBackIn';
import { useHomeSource } from './useHomeSource';
import { useHomeShelves } from './useHomeShelves';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (id: string, Type = 'MusicAlbum'): JellyfinItem => ({ Id: id, Name: id, Type });
const nativeShelf = (key: string, items: JellyfinItem[] = []) => ({
  [key]: items,
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
});

function mockNative(overrides: Record<string, JellyfinItem[]> = {}) {
  vi.mocked(homeApi.useLatestAlbums).mockReturnValue(
    nativeShelf('albums', overrides.albums) as never,
  );
  vi.mocked(homeApi.useSuggestedSongs).mockReturnValue(nativeShelf('songs') as never);
  vi.mocked(homeApi.useRecentlyPlayed).mockReturnValue(nativeShelf('songs') as never);
  vi.mocked(homeApi.useOnRepeat).mockReturnValue(nativeShelf('songs') as never);
  vi.mocked(homeApi.usePublicPlaylists).mockReturnValue(nativeShelf('playlists') as never);
  vi.mocked(libApi.useSavedAlbums).mockReturnValue(nativeShelf('albums') as never);
  vi.mocked(libApi.useFollowedArtists).mockReturnValue(
    nativeShelf('artists', overrides.artists) as never,
  );
  vi.mocked(useJumpBackIn).mockReturnValue({
    items: [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as never);
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('useHomeShelves source selection', () => {
  it('uses plugin data for album/song shelves, native for artists, on the fast path', () => {
    mockNative({ artists: [item('native-artist', 'MusicArtist')] });
    vi.mocked(useHomeSource).mockReturnValue({
      active: true,
      data: {
        latestAlbums: [item('plugin-album')],
        suggestedSongs: [item('plugin-song', 'Audio')],
        savedAlbums: [],
        recentlyPlayed: [],
        onRepeat: [],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useHomeShelves());
    // Album/song shelves come from the plugin; those native queries are gated off.
    expect(result.current.albums.albums[0].Id).toBe('plugin-album');
    expect(homeApi.useLatestAlbums).toHaveBeenCalledWith(false);
    expect(homeApi.useRecentlyPlayed).toHaveBeenCalledWith(20, false);
    // Artists are ALWAYS native (plugin can't serve favorite artists) — enabled
    // with no gate, and the shelf reflects the native result, not the plugin's.
    expect(result.current.artists.artists[0].Id).toBe('native-artist');
    expect(libApi.useFollowedArtists).toHaveBeenCalledWith();
  });

  it('falls back to native (enabled) when the plugin path is inactive', () => {
    mockNative({ albums: [item('native-album')] });
    vi.mocked(useHomeSource).mockReturnValue({
      active: false,
      data: null,
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useHomeShelves());
    expect(result.current.albums.albums[0].Id).toBe('native-album');
    expect(homeApi.useLatestAlbums).toHaveBeenCalledWith(true);
    // Artists always native (no enable gate), on this path too.
    expect(libApi.useFollowedArtists).toHaveBeenCalledWith();
  });

  it('falls back to native when the plugin call errored (data null despite active)', () => {
    mockNative({ albums: [item('native-fallback')] });
    vi.mocked(useHomeSource).mockReturnValue({
      active: true,
      data: null, // errored
      isLoading: false,
      isError: true,
      refetch: vi.fn(),
    });
    const { result } = renderHook(() => useHomeShelves());
    expect(result.current.albums.albums[0].Id).toBe('native-fallback');
    expect(homeApi.useLatestAlbums).toHaveBeenCalledWith(true);
  });
});
