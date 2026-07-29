import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useOfflineLibrary } from './useOfflineLibrary';
import { addToIndex } from '../downloads/downloadIndex';
import { saveOfflinePlaylist } from './offlinePlaylistStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (over: Partial<JellyfinItem>): JellyfinItem =>
  ({ Id: over.Id ?? 'x', Name: over.Name ?? 'x', Type: 'Audio', ...over }) as JellyfinItem;

describe('useOfflineLibrary', () => {
  afterEach(() => localStorage.clear());

  it('builds the library from the current index', () => {
    addToIndex(track({ Id: 'a', Album: 'Dune', AlbumId: 'al' }));
    const { result } = renderHook(() => useOfflineLibrary());
    expect(result.current.songs).toHaveLength(1);
    expect(result.current.albums).toHaveLength(1);
  });

  it('rebuilds when a download or playlist changes', () => {
    const { result } = renderHook(() => useOfflineLibrary());
    expect(result.current.songs).toHaveLength(0);
    act(() => addToIndex(track({ Id: 'a', Album: 'Dune', AlbumId: 'al' })));
    act(() => saveOfflinePlaylist({ id: 'p', name: 'Mix', trackIds: ['a'] }));
    expect(result.current.songs).toHaveLength(1);
    expect(result.current.playlists).toHaveLength(1);
  });
});
