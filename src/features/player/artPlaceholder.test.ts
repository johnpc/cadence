// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { book, list, musicalNotes } from 'ionicons/icons';
import { artHue, artInitials, artPlaceholder } from './artPlaceholder';

describe('artPlaceholder', () => {
  it('derives a stable hue per name', () => {
    expect(artHue('Dan Mangan')).toBe(artHue('Dan Mangan'));
    expect(artHue('Dan Mangan')).not.toBe(artHue('Dan Mangen'));
    expect(artHue('')).toBeGreaterThanOrEqual(0);
    expect(artHue('love-sadKID')).toBeLessThan(360);
  });

  it('takes the first letters of the first and last words', () => {
    expect(artInitials('Dan Mangan')).toBe('DM');
    expect(artInitials('love-sadKID')).toBe('LS');
    expect(artInitials('Lovers Hifi')).toBe('LH');
    expect(artInitials('Björk')).toBe('B');
    expect(artInitials('  ')).toBe('');
  });

  it('round art gets initials; square art and nameless items get a kind icon', () => {
    expect(
      artPlaceholder({ Id: 'a', Name: 'Lovers Hifi', Type: 'MusicArtist' }, true),
    ).toMatchObject({
      kind: 'initials',
      text: 'LH',
    });
    expect(artPlaceholder({ Id: 'b', Name: 'Mix', Type: 'Playlist' }, false)).toMatchObject({
      kind: 'icon',
      icon: list,
    });
    expect(artPlaceholder({ Id: 'c', Name: 'Dune', Type: 'AudioBook' }, false)).toMatchObject({
      kind: 'icon',
      icon: book,
    });
    expect(artPlaceholder(null, true)).toMatchObject({ kind: 'icon', icon: musicalNotes });
  });
});
