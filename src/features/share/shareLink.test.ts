import { afterEach, describe, expect, it, vi } from 'vitest';
import { itemPath, shareUrl, copyShareLink } from './shareLink';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (over: Partial<JellyfinItem>): JellyfinItem => ({
  Id: 'x',
  Name: 'x',
  Type: 'Audio',
  ...over,
});

describe('itemPath / shareUrl', () => {
  it('routes albums, artists, and playlists to their pages', () => {
    expect(itemPath(item({ Id: 'a', Type: 'MusicAlbum' }))).toBe('/album/a');
    expect(itemPath(item({ Id: 'r', Type: 'MusicArtist' }))).toBe('/artist/r');
    expect(itemPath(item({ Id: 'p', Type: 'Playlist' }))).toBe('/playlist/p');
  });

  it('routes a track to its album, or null with no album', () => {
    expect(itemPath(item({ Type: 'Audio', AlbumId: 'al' }))).toBe('/album/al');
    expect(itemPath(item({ Type: 'Audio' }))).toBeNull();
  });

  it('builds an absolute URL against the origin', () => {
    expect(shareUrl(item({ Id: 'a', Type: 'MusicAlbum' }), 'https://cadence.jpc.io')).toBe(
      'https://cadence.jpc.io/album/a',
    );
    expect(shareUrl(item({ Type: 'Audio' }), 'https://x')).toBeNull();
  });
});

describe('copyShareLink', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes the URL to the clipboard and resolves true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const ok = await copyShareLink(item({ Id: 'a', Type: 'MusicAlbum' }), 'https://x');
    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith('https://x/album/a');
  });

  it('resolves false when there is nothing to link', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn() } });
    expect(await copyShareLink(item({ Type: 'Audio' }), 'https://x')).toBe(false);
  });

  it('resolves false when the clipboard write fails', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    expect(await copyShareLink(item({ Id: 'a', Type: 'MusicAlbum' }), 'https://x')).toBe(false);
  });
});
