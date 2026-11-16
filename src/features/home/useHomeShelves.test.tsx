import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Mock every sub-hook so the composition is asserted in isolation.
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
vi.mock('../playlists/playlistsApi', () => ({ usePlaylists: vi.fn() }));

import * as homeApi from './homeApi';
import * as libApi from '../library/libraryApi';
import { useJumpBackIn } from './useJumpBackIn';
import { usePlaylists } from '../playlists/playlistsApi';
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
  vi.mocked(usePlaylists).mockReturnValue({
    playlists: overrides.playlists ?? [],
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as never);
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('useHomeShelves', () => {
  it('serves every shelf from its native query, all fired at once', () => {
    mockNative({
      albums: [item('a1')],
      artists: [item('ar1', 'MusicArtist')],
      playlists: [
        { ...item('p1', 'Playlist'), UserData: { IsFavorite: true } },
        { ...item('p2', 'Playlist'), UserData: { IsFavorite: false } },
      ],
    });
    const { result } = renderHook(() => useHomeShelves());
    expect(result.current.albums).toMatchObject({ albums: [{ Id: 'a1' }] });
    expect(result.current.artists).toMatchObject({ artists: [{ Id: 'ar1' }] });
    // Favorited (hearted) playlists only.
    expect(result.current.favorites.playlists.map((p) => p.Id)).toEqual(['p1']);
    // Nothing waits on a plugin: each native hook is enabled from the first render.
    for (const hook of [
      homeApi.useLatestAlbums,
      homeApi.useSuggestedSongs,
      homeApi.useOnRepeat,
      libApi.useSavedAlbums,
    ]) {
      expect(vi.mocked(hook).mock.calls[0]).not.toContain(false);
    }
    expect(vi.mocked(homeApi.useRecentlyPlayed)).toHaveBeenCalledWith(20);
  });

  it('refetching favorites refetches the playlists query', () => {
    mockNative();
    const { result } = renderHook(() => useHomeShelves());
    result.current.favorites.refetch();
    expect(vi.mocked(usePlaylists).mock.results[0].value.refetch).toHaveBeenCalled();
  });
});
