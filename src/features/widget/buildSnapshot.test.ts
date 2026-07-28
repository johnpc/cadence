import { describe, expect, it } from 'vitest';
import { buildSnapshot, itemPath, secondsRemaining } from './buildSnapshot';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const S = 10_000_000;
const art = (i: JellyfinItem) => `art:${i.Id}`;

const book = (over: Partial<JellyfinItem> = {}): JellyfinItem =>
  ({
    Id: 'b1',
    Name: 'Dune',
    Type: 'AudioBook',
    AlbumArtist: 'Frank Herbert',
    RunTimeTicks: 1000 * S,
    UserData: { PlaybackPositionTicks: 250 * S },
    ...over,
  }) as JellyfinItem;

const album = (over: Partial<JellyfinItem> = {}): JellyfinItem =>
  ({
    Id: 'a1',
    Name: 'Random Access Memories',
    Type: 'MusicAlbum',
    AlbumArtist: 'Daft Punk',
    ...over,
  }) as JellyfinItem;

describe('buildSnapshot', () => {
  it('prefers an in-progress audiobook with progress + author', () => {
    const s = buildSnapshot([book()], [album()], art)!;
    expect(s.kind).toBe('audiobook');
    expect(s.title).toBe('Dune');
    expect(s.subtitle).toBe('Frank Herbert');
    expect(s.progress).toBeCloseTo(0.25, 5);
    expect(s.artUrl).toBe('art:b1');
    expect(s.deepLink).toBe('cadence://open?path=%2Faudiobooks');
  });

  it('falls back to the most recent collection when no audiobook is in progress', () => {
    const s = buildSnapshot([], [album()], art)!;
    expect(s.kind).toBe('album');
    expect(s.title).toBe('Random Access Memories');
    expect(s.subtitle).toBe('Daft Punk');
    expect(s.progress).toBeNull();
    expect(s.deepLink).toBe('cadence://open?path=%2Falbum%2Fa1');
  });

  it('labels artists and playlists by kind', () => {
    const artist = buildSnapshot(
      [],
      [{ Id: 'ar', Name: 'Bonobo', Type: 'MusicArtist' } as JellyfinItem],
      art,
    )!;
    expect(artist.kind).toBe('artist');
    expect(artist.subtitle).toBe('Artist');
    const pl = buildSnapshot(
      [],
      [{ Id: 'p', Name: 'Focus', Type: 'Playlist' } as JellyfinItem],
      art,
    )!;
    expect(pl.kind).toBe('playlist');
    expect(pl.deepLink).toBe('cadence://open?path=%2Fplaylist%2Fp');
  });

  it('is null when there is nothing to resume', () => {
    expect(buildSnapshot([], [], art)).toBeNull();
  });

  it('null progress when the book has no saved position', () => {
    const s = buildSnapshot([book({ UserData: {} })], [], art)!;
    expect(s.progress).toBeNull();
  });
});

describe('itemPath', () => {
  it('maps each type to its route', () => {
    expect(itemPath({ Id: 'x', Name: '', Type: 'AudioBook' } as JellyfinItem)).toBe('/audiobooks');
    expect(itemPath({ Id: 'x', Name: '', Type: 'Playlist' } as JellyfinItem)).toBe('/playlist/x');
    expect(itemPath({ Id: 'x', Name: '', Type: 'MusicArtist' } as JellyfinItem)).toBe('/artist/x');
    expect(itemPath({ Id: 'x', Name: '', Type: 'MusicAlbum' } as JellyfinItem)).toBe('/album/x');
  });
});

describe('secondsRemaining', () => {
  it('computes remaining seconds for a book', () => {
    expect(secondsRemaining(book())).toBe(750); // (1000-250)s
  });
  it('is null with no position/duration', () => {
    expect(secondsRemaining(book({ UserData: {}, RunTimeTicks: 0 }))).toBeNull();
  });
});
