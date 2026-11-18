// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { searchDownloads } from './downloadsSearch';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const t = (Id: string, Name: string, extra: Partial<JellyfinItem> = {}): JellyfinItem => ({
  Id,
  Name,
  Type: 'Audio',
  ...extra,
});
const tracks = [
  t('1', 'Undertow', { Artists: ['The Tidal Room'], Album: 'Saltwater' }),
  t('2', 'Salt and Cedar', { Artists: ['The Tidal Room'], Album: 'Saltwater' }),
  t('3', 'Café Lights', { AlbumArtist: 'Lovelight Parade', Album: 'Neon Letters' }),
  t('4', 'Pepper Salt', { Artists: ['Copper Kettle'] }),
];
const ids = (q: string) => searchDownloads(q, tracks).map((x) => x.Id);

describe('searchDownloads', () => {
  it('matches title, artist, album artist and album', () => {
    expect(ids('undertow')).toEqual(['1']);
    expect(ids('tidal room')).toEqual(['2', '1']);
    expect(ids('lovelight')).toEqual(['3']);
    expect(ids('neon')).toEqual(['3']);
  });

  it('ranks a title that starts with the query, then one containing it, then the rest', () => {
    // "salt": title starts (Salt and Cedar), title contains (Pepper Salt), album only (Undertow)
    expect(ids('salt')).toEqual(['2', '4', '1']);
  });

  it('is case- and accent-insensitive and needs every word', () => {
    expect(ids('CAFE')).toEqual(['3']);
    expect(ids('salt kettle')).toEqual(['4']);
    expect(ids('salt nothing')).toEqual([]);
  });

  it('returns nothing for a blank query, and respects the limit', () => {
    expect(ids('   ')).toEqual([]);
    expect(searchDownloads('t', tracks, 2)).toHaveLength(2);
  });

  it('copes with tracks missing optional fields', () => {
    expect(searchDownloads('x', [{ Id: 'z', Type: 'Audio' } as JellyfinItem])).toEqual([]);
  });
});
