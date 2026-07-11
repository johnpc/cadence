import { describe, expect, it } from 'vitest';
import { nowPlayingAnnouncement } from './nowPlayingAnnouncement';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

describe('nowPlayingAnnouncement', () => {
  it('announces title and artist', () => {
    const track: JellyfinItem = { Id: 't', Name: 'Song', Type: 'Audio', Artists: ['Band'] };
    expect(nowPlayingAnnouncement(track)).toBe('Now playing: Song by Band');
  });

  it('drops the "by" clause when the artist is unknown', () => {
    const track: JellyfinItem = { Id: 't', Name: 'Song', Type: 'Audio' };
    expect(nowPlayingAnnouncement(track)).toBe('Now playing: Song');
  });

  it('is empty when nothing is playing', () => {
    expect(nowPlayingAnnouncement(null)).toBe('');
  });
});
