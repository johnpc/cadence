import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useOfflineGroup } from './useOfflineGroup';
import { addToIndex } from '../downloads/downloadIndex';
import { saveOfflinePlaylist } from './offlinePlaylistStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (over: Partial<JellyfinItem>): JellyfinItem =>
  ({ Id: over.Id ?? 'x', Name: over.Name ?? 'x', Type: 'Audio', ...over }) as JellyfinItem;

describe('useOfflineGroup', () => {
  afterEach(() => localStorage.clear());

  it('resolves an album by id to its tracks', () => {
    addToIndex(track({ Id: 'a', Album: 'Dune', AlbumId: 'al' }));
    const { result } = renderHook(() => useOfflineGroup('album', 'al'));
    expect(result.current?.title).toBe('Dune');
    expect(result.current?.tracks).toHaveLength(1);
  });

  it('resolves an audiobook by id to its parts', () => {
    addToIndex(track({ Id: 'bk', Name: 'Circe', Album: 'Circe', Type: 'AudioBook' }));
    const { result } = renderHook(() => useOfflineGroup('audiobook', 'bk'));
    expect(result.current?.title).toBe('Circe');
  });

  it('resolves a playlist by id', () => {
    addToIndex(track({ Id: 'a', Album: 'Dune', AlbumId: 'al' }));
    saveOfflinePlaylist({ id: 'p', name: 'Mix', trackIds: ['a'] });
    const { result } = renderHook(() => useOfflineGroup('playlist', 'p'));
    expect(result.current?.title).toBe('Mix');
  });

  it('returns null when the group is not found', () => {
    const { result } = renderHook(() => useOfflineGroup('album', 'missing'));
    expect(result.current).toBeNull();
  });
});
