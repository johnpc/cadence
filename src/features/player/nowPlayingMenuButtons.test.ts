import { describe, expect, it, vi } from 'vitest';
import { nowPlayingMenuButtons, type NowPlayingMenuActions } from './nowPlayingMenuButtons';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const actions = (): NowPlayingMenuActions => ({
  goToSong: vi.fn(),
  startRadio: vi.fn(),
  goToAlbum: vi.fn(),
  goToArtist: vi.fn(),
  copyLink: vi.fn(),
  addToPlaylist: vi.fn(),
});

const labels = (track: JellyfinItem) => nowPlayingMenuButtons(track, actions()).map((b) => b.text);

describe('nowPlayingMenuButtons', () => {
  it('offers go-to-song, a single Add to playlist…, radio, copy link, Cancel', () => {
    const l = labels({ Id: 't', Name: 'x', Type: 'Audio' });
    expect(l).toEqual([
      'Go to song',
      'Add to playlist…',
      'Go to song radio',
      'Copy link',
      'Cancel',
    ]);
  });

  it('does NOT inline individual playlists', () => {
    const l = labels({ Id: 't', Name: 'x', Type: 'Audio' });
    expect(l.some((t) => t.startsWith('Add to ') && t !== 'Add to playlist…')).toBe(false);
  });

  it('includes Go to album/artist only when the track has them', () => {
    const track: JellyfinItem = {
      Id: 't',
      Name: 'x',
      Type: 'Audio',
      AlbumId: 'al',
      ArtistItems: [{ Id: 'ar', Name: 'A' }],
    };
    expect(labels(track)).toContain('Go to album');
    expect(labels(track)).toContain('Go to artist');
  });

  it('routes Add to playlist… to the picker opener', () => {
    const a = actions();
    nowPlayingMenuButtons({ Id: 't', Name: 'x', Type: 'Audio' }, a)
      .find((b) => b.text === 'Add to playlist…')
      ?.handler?.();
    expect(a.addToPlaylist).toHaveBeenCalledOnce();
  });
});
