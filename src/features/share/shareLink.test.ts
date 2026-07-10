import { afterEach, describe, expect, it, vi } from 'vitest';
import { itemPath, shareUrl, copyShareLink, shareItem } from './shareLink';
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

  it('routes a track to its own song page (album only if the id is missing)', () => {
    expect(itemPath(item({ Id: 's', Type: 'Audio', AlbumId: 'al' }))).toBe('/song/s');
    expect(itemPath(item({ Id: '', Type: 'Audio', AlbumId: 'al' }))).toBe('/album/al');
    expect(itemPath(item({ Id: '', Type: 'Audio' }))).toBeNull();
  });

  it('builds an absolute URL against the origin', () => {
    expect(shareUrl(item({ Id: 'a', Type: 'MusicAlbum' }), 'https://cadence.jpc.io')).toBe(
      'https://cadence.jpc.io/album/a',
    );
    expect(shareUrl(item({ Id: '', Type: 'Audio' }), 'https://x')).toBeNull();
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
    expect(await copyShareLink(item({ Id: '', Type: 'Audio' }), 'https://x')).toBe(false);
  });

  it('resolves false when the clipboard write fails', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    expect(await copyShareLink(item({ Id: 'a', Type: 'MusicAlbum' }), 'https://x')).toBe(false);
  });
});

describe('shareItem', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const album = item({ Id: 'a', Type: 'MusicAlbum' });

  it('uses the native share sheet when available → "shared"', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    expect(await shareItem(album, 'https://x')).toBe('shared');
    expect(share).toHaveBeenCalledWith({ title: 'x', url: 'https://x/album/a' });
  });

  it('treats a dismissed share sheet (AbortError) as a silent "failed", no copy', async () => {
    const abort = Object.assign(new Error('cancelled'), { name: 'AbortError' });
    const writeText = vi.fn();
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(abort),
      clipboard: { writeText },
    });
    expect(await shareItem(album, 'https://x')).toBe('failed');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('falls back to clipboard when share is unavailable → "copied"', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    expect(await shareItem(album, 'https://x')).toBe('copied');
    expect(writeText).toHaveBeenCalledWith('https://x/album/a');
  });

  it('falls back to clipboard when share throws a non-abort error', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', {
      share: vi.fn().mockRejectedValue(new Error('unsupported')),
      clipboard: { writeText },
    });
    expect(await shareItem(album, 'https://x')).toBe('copied');
  });

  it('returns "failed" when there is nothing to link', async () => {
    vi.stubGlobal('navigator', { share: vi.fn() });
    expect(await shareItem(item({ Id: '', Type: 'Audio' }), 'https://x')).toBe('failed');
  });
});
