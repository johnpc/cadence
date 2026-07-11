import { describe, expect, it, vi } from 'vitest';
import { trackMenuButtons, addToPlaylistButtons, type TrackMenuActions } from './trackMenuButtons';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const actions = (over: Partial<TrackMenuActions> = {}): TrackMenuActions => ({
  playNext: vi.fn(),
  addToQueue: vi.fn(),
  addToPlaylist: vi.fn(),
  startRadio: vi.fn(),
  goToAlbum: vi.fn(),
  goToArtist: vi.fn(),
  copyLink: vi.fn(),
  toggleLike: vi.fn(),
  liked: false,
  toggleDownload: vi.fn(),
  downloaded: false,
  ...over,
});

const labels = (track: JellyfinItem, over: Partial<TrackMenuActions> = {}) =>
  trackMenuButtons(track, actions(over)).map((b) => b.text);

describe('trackMenuButtons', () => {
  it('offers like, download, play/queue, add to playlist, radio, copy link, Cancel', () => {
    const l = labels({ Id: 't', Name: 'x', Type: 'Audio' });
    expect(l).toEqual([
      'Add to Liked Songs',
      'Download',
      'Play next',
      'Add to queue',
      'Add to playlist…',
      'Go to song radio',
      'Copy link',
      'Cancel',
    ]);
  });

  it('reflects liked/downloaded state in the labels', () => {
    const l = labels({ Id: 't', Name: 'x', Type: 'Audio' }, { liked: true, downloaded: true });
    expect(l).toContain('Remove from Liked Songs');
    expect(l).toContain('Remove download');
  });

  it('includes reorder + remove ONLY when the editable-playlist actions are given', () => {
    const base = labels({ Id: 't', Name: 'x', Type: 'Audio' });
    expect(base).not.toContain('Move up');
    expect(base).not.toContain('Remove from this playlist');
    const edit = labels(
      { Id: 't', Name: 'x', Type: 'Audio' },
      { moveUp: vi.fn(), moveDown: vi.fn(), removeFromPlaylist: vi.fn() },
    );
    expect(edit).toContain('Move up');
    expect(edit).toContain('Move down');
    expect(edit).toContain('Remove from this playlist');
  });

  it('fires like/download/remove handlers', () => {
    const a = actions({ moveUp: vi.fn(), removeFromPlaylist: vi.fn() });
    const btns = trackMenuButtons({ Id: 't', Name: 'x', Type: 'Audio' }, a);
    btns.find((b) => b.text === 'Add to Liked Songs')?.handler?.();
    btns.find((b) => b.text === 'Download')?.handler?.();
    btns.find((b) => b.text === 'Remove from this playlist')?.handler?.();
    expect(a.toggleLike).toHaveBeenCalledOnce();
    expect(a.toggleDownload).toHaveBeenCalledOnce();
    expect(a.removeFromPlaylist).toHaveBeenCalledOnce();
  });

  it('does NOT inline individual playlists in the primary menu', () => {
    const l = labels({ Id: 't', Name: 'x', Type: 'Audio' });
    const generic = new Set(['Add to queue', 'Add to playlist…', 'Add to Liked Songs']);
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
