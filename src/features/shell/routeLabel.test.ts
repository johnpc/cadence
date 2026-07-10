import { describe, expect, it } from 'vitest';
import { routeLabel } from './routeLabel';

describe('routeLabel', () => {
  it('names the tab/list routes', () => {
    expect(routeLabel('/home')).toBe('Home');
    expect(routeLabel('/search')).toBe('Search');
    expect(routeLabel('/library')).toBe('Your Library');
    expect(routeLabel('/liked')).toBe('Liked Songs');
    expect(routeLabel('/settings')).toBe('Settings');
    expect(routeLabel('/history')).toBe('Recently played');
  });

  it('names detail routes by kind (the id is not a name)', () => {
    expect(routeLabel('/album/abc123')).toBe('Album');
    expect(routeLabel('/artist/x')).toBe('Artist');
    expect(routeLabel('/playlist/p1')).toBe('Playlist');
    expect(routeLabel('/song/s1')).toBe('Song');
    expect(routeLabel('/genre/Rock')).toBe('Genre');
  });

  it('treats the root as Home and falls back to the app name', () => {
    expect(routeLabel('/')).toBe('Home');
    expect(routeLabel('')).toBe('Home');
    expect(routeLabel('/nonsense')).toBe('Cadence');
  });
});
