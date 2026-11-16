import { describe, expect, it } from 'vitest';
import { parseDeezerPlaylistId, isValidDeezerPlaylist } from './deezerUrl';

describe('parseDeezerPlaylistId', () => {
  it('extracts the id from a full Deezer URL', () => {
    expect(parseDeezerPlaylistId('https://www.deezer.com/playlist/908622995')).toBe('908622995');
  });

  it('extracts the id from a localized URL with query params', () => {
    expect(parseDeezerPlaylistId('https://www.deezer.com/en/playlist/123?utm_source=x')).toBe(
      '123',
    );
  });

  it('accepts a host without scheme', () => {
    expect(parseDeezerPlaylistId('deezer.com/playlist/456')).toBe('456');
  });

  it('accepts a bare numeric id', () => {
    expect(parseDeezerPlaylistId('789')).toBe('789');
  });

  it('trims surrounding whitespace', () => {
    expect(parseDeezerPlaylistId('  908622995  ')).toBe('908622995');
  });

  it('returns null for empty input', () => {
    expect(parseDeezerPlaylistId('   ')).toBeNull();
  });

  it('returns null when there is no playlist id', () => {
    expect(parseDeezerPlaylistId('https://www.deezer.com/artist/123')).toBeNull();
    expect(parseDeezerPlaylistId('not a link')).toBeNull();
  });
});

describe('isValidDeezerPlaylist', () => {
  it('is true for a valid reference and false otherwise', () => {
    expect(isValidDeezerPlaylist('https://www.deezer.com/playlist/1')).toBe(true);
    expect(isValidDeezerPlaylist('42')).toBe(true);
    expect(isValidDeezerPlaylist('')).toBe(false);
    expect(isValidDeezerPlaylist('https://open.spotify.com/playlist/abc')).toBe(false);
  });
});
