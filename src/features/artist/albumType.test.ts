import { describe, expect, it } from 'vitest';
import { albumType, groupDiscography } from './albumType';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album = (over: Partial<JellyfinItem>): JellyfinItem =>
  ({ Id: over.Id ?? 'x', Name: over.Name ?? 'x', Type: 'MusicAlbum', ...over }) as JellyfinItem;

describe('albumType', () => {
  it('classifies a full-length (7+ tracks) as an album', () => {
    expect(albumType(album({ ChildCount: 12 }))).toBe('albums');
  });

  it('classifies short releases (1–6 tracks) as singles/EPs', () => {
    expect(albumType(album({ ChildCount: 1 }))).toBe('singles');
    expect(albumType(album({ ChildCount: 6 }))).toBe('singles');
  });

  it('classifies "Various Artists" as a compilation regardless of length', () => {
    expect(albumType(album({ AlbumArtist: 'Various Artists', ChildCount: 20 }))).toBe(
      'compilations',
    );
  });

  it('defaults to albums when track count is unknown (never hide a release)', () => {
    expect(albumType(album({}))).toBe('albums');
    expect(albumType(album({ ChildCount: 0 }))).toBe('albums');
  });
});

describe('groupDiscography', () => {
  it('splits into ordered, non-empty sections (Albums → Singles → Compilations)', () => {
    const groups = groupDiscography([
      album({ Id: 'a', ChildCount: 10 }),
      album({ Id: 's', ChildCount: 2 }),
      album({ Id: 'c', AlbumArtist: 'Various Artists', ChildCount: 15 }),
    ]);
    expect(groups.map((g) => g.section)).toEqual(['albums', 'singles', 'compilations']);
    expect(groups.map((g) => g.title)).toEqual(['Albums', 'Singles & EPs', 'Compilations']);
  });

  it('omits empty sections', () => {
    const groups = groupDiscography([album({ Id: 'a', ChildCount: 10 })]);
    expect(groups).toHaveLength(1);
    expect(groups[0].section).toBe('albums');
  });

  it('preserves input order within a group', () => {
    const groups = groupDiscography([
      album({ Id: 'a1', ChildCount: 10 }),
      album({ Id: 'a2', ChildCount: 8 }),
    ]);
    expect(groups[0].albums.map((a) => a.Id)).toEqual(['a1', 'a2']);
  });

  it('returns nothing for an empty discography', () => {
    expect(groupDiscography([])).toEqual([]);
  });
});
