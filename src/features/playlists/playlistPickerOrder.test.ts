import { describe, expect, it } from 'vitest';
import { orderPlaylistsForPicker } from './playlistPickerOrder';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const pl = (id: string, fav = false): JellyfinItem => ({
  Id: id,
  Name: id,
  Type: 'Playlist',
  ...(fav ? { UserData: { IsFavorite: true } } : {}),
});

describe('orderPlaylistsForPicker', () => {
  it('puts favorites first, then recently-added, then the rest (stable)', () => {
    const list = [pl('a'), pl('fav', true), pl('recent'), pl('b')];
    const order = orderPlaylistsForPicker(list, { recent: 1000 }).map((p) => p.Id);
    expect(order).toEqual(['fav', 'recent', 'a', 'b']);
  });

  it('orders multiple recents by most-recent first', () => {
    const list = [pl('old'), pl('new')];
    const order = orderPlaylistsForPicker(list, { old: 100, new: 200 }).map((p) => p.Id);
    expect(order).toEqual(['new', 'old']);
  });

  it('keeps the given order when nothing is favorited or recent', () => {
    const list = [pl('x'), pl('y'), pl('z')];
    expect(orderPlaylistsForPicker(list).map((p) => p.Id)).toEqual(['x', 'y', 'z']);
  });

  it('ranks a favorite above a more-recently-added non-favorite', () => {
    const list = [pl('recent'), pl('fav', true)];
    const order = orderPlaylistsForPicker(list, { recent: 9999 }).map((p) => p.Id);
    expect(order).toEqual(['fav', 'recent']);
  });
});
