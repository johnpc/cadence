import { describe, expect, it, vi } from 'vitest';
import { nowPlayingMenuButtons, type NowPlayingMenuActions } from './nowPlayingMenuButtons';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const actions = (): NowPlayingMenuActions => ({
  goToSong: vi.fn(),
  startRadio: vi.fn(),
  goToAlbum: vi.fn(),
  goToArtist: vi.fn(),
  copyLink: vi.fn(),
  newPlaylist: vi.fn(),
  addTo: vi.fn(),
});

const labels = (track: JellyfinItem, playlists: JellyfinItem[]) =>
  nowPlayingMenuButtons(track, playlists, actions()).map((b) => b.text);

describe('nowPlayingMenuButtons', () => {
  it('always offers go-to-song, radio, copy link, New playlist…, and Cancel', () => {
    const l = labels({ Id: 't', Name: 'x', Type: 'Audio' }, []);
    expect(l).toEqual(['Go to song', 'Go to song radio', 'Copy link', 'New playlist…', 'Cancel']);
  });

  it('includes Go to album/artist only when the track has them', () => {
    const track: JellyfinItem = {
      Id: 't',
      Name: 'x',
      Type: 'Audio',
      AlbumId: 'al',
      ArtistItems: [{ Id: 'ar', Name: 'A' }],
    };
    expect(labels(track, [])).toContain('Go to album');
    expect(labels(track, [])).toContain('Go to artist');
  });

  it('routes Go to song radio to startRadio', () => {
    const a = actions();
    const btns = nowPlayingMenuButtons({ Id: 't', Name: 'x', Type: 'Audio' }, [], a);
    btns.find((b) => b.text === 'Go to song radio')?.handler?.();
    expect(a.startRadio).toHaveBeenCalledOnce();
  });

  it('lists an Add-to entry per playlist and routes it, before Cancel', () => {
    const a = actions();
    const pl: JellyfinItem = { Id: 'p1', Name: 'Chill', Type: 'Playlist' };
    const btns = nowPlayingMenuButtons({ Id: 't', Name: 'x', Type: 'Audio' }, [pl], a);
    btns.find((b) => b.text === 'Add to Chill')?.handler?.();
    expect(a.addTo).toHaveBeenCalledWith(pl);
    expect(btns[btns.length - 1].text).toBe('Cancel');
  });
});
