import { describe, expect, it } from 'vitest';
import { buildDailyMixes, artistsFromTracks, MIX_COUNT } from './dailyMix';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const artist = (id: string, name = `Artist ${id}`): JellyfinItem => ({
  Id: id,
  Name: name,
  Type: 'MusicArtist',
});
const track = (id: string, artists: { Id: string; Name: string }[]): JellyfinItem => ({
  Id: id,
  Name: `Track ${id}`,
  Type: 'Audio',
  ArtistItems: artists,
});

describe('buildDailyMixes', () => {
  it('labels each mix "<Artist> Mix" seeded from the artist', () => {
    const mixes = buildDailyMixes([artist('a', 'Radiohead')]);
    expect(mixes).toEqual([{ seed: expect.objectContaining({ Id: 'a' }), title: 'Radiohead Mix' }]);
  });

  it('caps the number of mixes', () => {
    const many = Array.from({ length: 20 }, (_, i) => artist(String(i)));
    expect(buildDailyMixes(many)).toHaveLength(MIX_COUNT);
  });

  it('skips artists missing an id or name', () => {
    const mixes = buildDailyMixes([
      { Id: '', Name: 'No id', Type: 'MusicArtist' },
      { Id: 'x', Type: 'MusicArtist' } as JellyfinItem,
      artist('ok', 'Real'),
    ]);
    expect(mixes.map((m) => m.title)).toEqual(['Real Mix']);
  });

  it('falls back to listening-derived artists when few are followed', () => {
    const mixes = buildDailyMixes([artist('a', 'Followed')], [artist('b', 'Listened')]);
    expect(mixes.map((m) => m.title)).toEqual(['Followed Mix', 'Listened Mix']);
  });

  it('dedupes an artist that is both followed and in listening history', () => {
    const mixes = buildDailyMixes([artist('a', 'Dup')], [artist('a', 'Dup')]);
    expect(mixes).toHaveLength(1);
  });

  it('returns an empty list when there is no signal at all', () => {
    expect(buildDailyMixes([], [])).toEqual([]);
  });
});

describe('artistsFromTracks', () => {
  it('extracts distinct artists from tracks, first-seen order', () => {
    const artists = artistsFromTracks([
      track('t1', [{ Id: 'a', Name: 'A' }]),
      track('t2', [
        { Id: 'a', Name: 'A' },
        { Id: 'b', Name: 'B' },
      ]),
    ]);
    expect(artists.map((a) => a.Id)).toEqual(['a', 'b']);
    expect(artists[0]).toMatchObject({ Id: 'a', Name: 'A', Type: 'MusicArtist' });
  });

  it('ignores tracks with no ArtistItems and artists missing id/name', () => {
    const artists = artistsFromTracks([
      { Id: 't', Name: 'x', Type: 'Audio' },
      track('t2', [{ Id: '', Name: 'no id' }]),
      track('t3', [{ Id: 'ok', Name: 'Real' }]),
    ]);
    expect(artists.map((a) => a.Id)).toEqual(['ok']);
  });

  it('is empty for an empty track list', () => {
    expect(artistsFromTracks([])).toEqual([]);
  });
});
