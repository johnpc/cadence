import { describe, expect, it, vi } from 'vitest';
import { trackMenuButtons, addToPlaylistButtons, type TrackMenuActions } from './trackMenuButtons';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const actions = (): TrackMenuActions => ({
  playNext: vi.fn(),
  addToQueue: vi.fn(),
  addToPlaylist: vi.fn(),
  startRadio: vi.fn(),
  goToAlbum: vi.fn(),
  goToArtist: vi.fn(),
  copyLink: vi.fn(),
});

const labels = (track: JellyfinItem) => trackMenuButtons(track, actions()).map((b) => b.text);

describe('trackMenuButtons', () => {
  it('offers play/queue, a single Add to playlist…, radio, copy link, Cancel', () => {
    const l = labels({ Id: 't', Name: 'x', Type: 'Audio' });
    expect(l).toEqual([
      'Play next',
      'Add to queue',
      'Add to playlist…',
      'Go to song radio',
      'Copy link',
      'Cancel',
    ]);
  });

  it('does NOT inline individual playlists in the primary menu', () => {
    const l = labels({ Id: 't', Name: 'x', Type: 'Audio' });
    const generic = new Set(['Add to queue', 'Add to playlist…']);
    expect(l.some((t) => t.startsWith('Add to ') && !generic.has(t))).toBe(false);
  });

  it('routes Add to playlist… to the picker opener', () => {
    const a = actions();
    trackMenuButtons({ Id: 't', Name: 'x', Type: 'Audio' }, a)
      .find((b) => b.text === 'Add to playlist…')
      ?.handler?.();
    expect(a.addToPlaylist).toHaveBeenCalledOnce();
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
});

describe('addToPlaylistButtons', () => {
  const playlists: JellyfinItem[] = [
    { Id: 'p1', Name: 'Road Trip', Type: 'Playlist' },
    { Id: 'p2', Name: 'Chill', Type: 'Playlist' },
  ];

  it('lists New playlist… then each playlist by name, then Cancel', () => {
    const l = addToPlaylistButtons(playlists, { newPlaylist: vi.fn(), addTo: vi.fn() }).map(
      (b) => b.text,
    );
    expect(l).toEqual(['New playlist…', 'Road Trip', 'Chill', 'Cancel']);
  });

  it('routes a playlist tap to addTo with that playlist', () => {
    const addTo = vi.fn();
    addToPlaylistButtons(playlists, { newPlaylist: vi.fn(), addTo })
      .find((b) => b.text === 'Road Trip')
      ?.handler?.();
    expect(addTo).toHaveBeenCalledWith(playlists[0]);
  });
});
