import { afterEach, describe, expect, it } from 'vitest';
import { audioStreamUrl, imageUrl } from './navidromeStream';
import { setSession } from './sessionStore';
import { getServerUrl } from './serverUrlStore';
import { writeAudioQuality } from '../features/settings/audioQualityStore';
import type { MediaItem } from './navidromeTypes';

const session = { username: 'u', userId: 'uid', subsonicSalt: 'salt1', subsonicToken: 'tok1' };

describe('navidromeStream', () => {
  afterEach(() => {
    setSession(null);
    writeAudioQuality('auto');
    localStorage.clear();
  });

  it('builds a stream URL carrying the Subsonic auth params + item id', () => {
    setSession(session);
    const url = audioStreamUrl('song1');
    expect(url.startsWith(`${getServerUrl()}/rest/stream?`)).toBe(true);
    expect(url).toContain('id=song1');
    expect(url).toContain('u=u');
    expect(url).toContain('t=tok1');
    expect(url).toContain('s=salt1');
  });

  it('sends no bitrate cap or format on Automatic quality', () => {
    setSession(session);
    writeAudioQuality('auto');
    const url = audioStreamUrl('song1');
    expect(url).not.toContain('maxBitRate');
    expect(url).not.toContain('format=');
  });

  it('caps the bitrate (in kbps) and picks an explicit format for a chosen quality tier', () => {
    setSession(session);
    writeAudioQuality('low');
    expect(audioStreamUrl('song1')).toContain('maxBitRate=96');
    expect(audioStreamUrl('song1')).toContain('format=mp3');
    writeAudioQuality('high');
    expect(audioStreamUrl('song1')).toContain('maxBitRate=320');
  });

  it('uses the item id when it has its own primary image', () => {
    setSession(session);
    const item: MediaItem = {
      Id: 'i1',
      Name: 'x',
      Type: 'Audio',
      ImageTags: { Primary: 'coverart-id' },
    };
    const url = imageUrl(item)!;
    expect(url).toContain(`${getServerUrl()}/rest/getCoverArt?`);
    expect(url).toContain('id=i1');
    expect(url).toContain('size=400');
  });

  it('falls back to the album id for a track without its own art', () => {
    setSession(session);
    const item: MediaItem = { Id: 'i1', Name: 'x', Type: 'Audio', AlbumId: 'alb1' };
    const url = imageUrl(item)!;
    expect(url).toContain('id=alb1');
  });

  it('returns null when there is no art at all', () => {
    expect(imageUrl({ Id: 'i1', Name: 'x', Type: 'Audio' })).toBeNull();
  });
});
