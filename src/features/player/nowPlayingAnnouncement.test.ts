import { describe, expect, it } from 'vitest';
import { nowPlayingAnnouncement } from './nowPlayingAnnouncement';
import type { MediaItem } from '../../lib/navidromeTypes';

describe('nowPlayingAnnouncement', () => {
  it('announces title and artist', () => {
    const track: MediaItem = { Id: 't', Name: 'Song', Type: 'Audio', Artists: ['Band'] };
    expect(nowPlayingAnnouncement(track)).toBe('Now playing: Song by Band');
  });

  it('drops the "by" clause when the artist is unknown', () => {
    const track: MediaItem = { Id: 't', Name: 'Song', Type: 'Audio' };
    expect(nowPlayingAnnouncement(track)).toBe('Now playing: Song');
  });

  it('is empty when nothing is playing', () => {
    expect(nowPlayingAnnouncement(null)).toBe('');
  });
});
