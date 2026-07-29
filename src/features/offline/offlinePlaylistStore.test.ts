import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  readOfflinePlaylists,
  saveOfflinePlaylist,
  removeOfflinePlaylist,
} from './offlinePlaylistStore';
import { onDownloadsChange } from '../downloads/downloadEmitter';

describe('offlinePlaylistStore', () => {
  afterEach(() => localStorage.clear());

  it('starts empty and tolerates corrupt storage', () => {
    expect(readOfflinePlaylists()).toEqual([]);
    localStorage.setItem('cadence.offline.playlists', 'not json');
    expect(readOfflinePlaylists()).toEqual([]);
  });

  it('saves newest-first and replaces by id', () => {
    saveOfflinePlaylist({ id: 'a', name: 'A', trackIds: ['1'] });
    saveOfflinePlaylist({ id: 'b', name: 'B', trackIds: ['2'] });
    saveOfflinePlaylist({ id: 'a', name: 'A2', trackIds: ['1', '3'] });
    const list = readOfflinePlaylists();
    expect(list.map((p) => p.id)).toEqual(['a', 'b']);
    expect(list[0].name).toBe('A2');
    expect(list[0].trackIds).toEqual(['1', '3']);
  });

  it('removes by id', () => {
    saveOfflinePlaylist({ id: 'a', name: 'A', trackIds: [] });
    removeOfflinePlaylist('a');
    expect(readOfflinePlaylists()).toEqual([]);
  });

  it('emits a downloads-change on save and remove', () => {
    const listener = vi.fn();
    const off = onDownloadsChange(listener);
    saveOfflinePlaylist({ id: 'a', name: 'A', trackIds: [] });
    removeOfflinePlaylist('a');
    expect(listener).toHaveBeenCalledTimes(2);
    off();
  });
});
