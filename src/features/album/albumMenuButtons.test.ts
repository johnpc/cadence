import { describe, expect, it, vi } from 'vitest';
import { albumMenuButtons, type AlbumMenuActions } from './albumMenuButtons';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const actions = (): AlbumMenuActions => ({
  startRadio: vi.fn(),
  goToArtist: vi.fn(),
  addToQueue: vi.fn(),
  share: vi.fn(),
});

const labels = (album: JellyfinItem) => albumMenuButtons(album, actions()).map((b) => b.text);

describe('albumMenuButtons', () => {
  it('offers album radio, go to artist, copy link, and Cancel', () => {
    const l = labels({
      Id: 'al',
      Name: 'x',
      Type: 'MusicAlbum',
      ArtistItems: [{ Id: 'ar', Name: 'A' }],
    });
    expect(l).toEqual(['Add to queue', 'Go to album radio', 'Go to artist', 'Share', 'Cancel']);
  });

  it('omits Go to artist when the album has no artist', () => {
    const l = labels({ Id: 'al', Name: 'x', Type: 'MusicAlbum' });
    expect(l).toEqual(['Add to queue', 'Go to album radio', 'Share', 'Cancel']);
  });

  it('wires each handler to its button', () => {
    const a = actions();
    const buttons = albumMenuButtons(
      { Id: 'al', Name: 'x', Type: 'MusicAlbum', ArtistItems: [{ Id: 'ar', Name: 'A' }] },
      a,
    );
    buttons.find((b) => b.text === 'Go to album radio')?.handler?.();
    buttons.find((b) => b.text === 'Go to artist')?.handler?.();
    expect(a.startRadio).toHaveBeenCalledOnce();
    expect(a.goToArtist).toHaveBeenCalledOnce();
  });
});
