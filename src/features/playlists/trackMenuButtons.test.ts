import { describe, expect, it, vi } from 'vitest';
import { trackMenuButtons, type TrackMenuActions } from './trackMenuButtons';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const actions = (): TrackMenuActions => ({
  playNext: vi.fn(),
  addToQueue: vi.fn(),
  goToAlbum: vi.fn(),
  goToArtist: vi.fn(),
  copyLink: vi.fn(),
  newPlaylist: vi.fn(),
  addTo: vi.fn(),
});

const labels = (track: JellyfinItem, playlists: JellyfinItem[]) =>
  trackMenuButtons(track, playlists, actions()).map((b) => b.text);

describe('trackMenuButtons', () => {
  it('always offers play/queue, copy link, New playlist…, and Cancel', () => {
    const l = labels({ Id: 't', Name: 'x', Type: 'Audio' }, []);
    expect(l).toEqual(['Play next', 'Add to queue', 'Copy link', 'New playlist…', 'Cancel']);
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

  it('lists an "Add to <name>" entry per existing playlist, before Cancel', () => {
    const playlists: JellyfinItem[] = [
      { Id: 'p1', Name: 'Road Trip', Type: 'Playlist' },
      { Id: 'p2', Name: 'Chill', Type: 'Playlist' },
    ];
    const l = labels({ Id: 't', Name: 'x', Type: 'Audio' }, playlists);
    expect(l).toContain('Add to Road Trip');
    expect(l).toContain('Add to Chill');
    expect(l.indexOf('New playlist…')).toBeLessThan(l.indexOf('Add to Road Trip'));
    expect(l[l.length - 1]).toBe('Cancel');
  });

  it('routes addTo to the tapped playlist', () => {
    const a = actions();
    const pl: JellyfinItem = { Id: 'p1', Name: 'Road Trip', Type: 'Playlist' };
    const btns = trackMenuButtons({ Id: 't', Name: 'x', Type: 'Audio' }, [pl], a);
    btns.find((b) => b.text === 'Add to Road Trip')?.handler?.();
    expect(a.addTo).toHaveBeenCalledWith(pl);
  });
});
