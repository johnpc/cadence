import { afterEach, describe, expect, it } from 'vitest';
import { audioStreamUrl, imageUrl } from './jellyfinStream';
import { setSession } from './sessionStore';
import { getServerUrl } from './serverUrlStore';
import { writeAudioQuality } from '../features/settings/audioQualityStore';
import type { JellyfinItem } from './jellyfinTypes';

describe('jellyfinStream', () => {
  afterEach(() => {
    setSession(null);
    writeAudioQuality('auto');
    localStorage.clear();
  });

  it('builds an audio stream URL carrying the session token + user', () => {
    setSession({ token: 'tok', userId: 'uid' });
    const url = audioStreamUrl('song1');
    expect(url.startsWith(`${getServerUrl()}/Audio/song1/universal?`)).toBe(true);
    expect(url).toContain('api_key=tok');
    expect(url).toContain('UserId=uid');
  });

  it('sends no bitrate cap on Automatic quality', () => {
    setSession({ token: 'tok', userId: 'uid' });
    writeAudioQuality('auto');
    expect(audioStreamUrl('song1')).not.toContain('MaxStreamingBitrate');
  });

  it('caps the bitrate to the chosen quality tier', () => {
    setSession({ token: 'tok', userId: 'uid' });
    writeAudioQuality('low');
    expect(audioStreamUrl('song1')).toContain('MaxStreamingBitrate=96000');
    writeAudioQuality('high');
    expect(audioStreamUrl('song1')).toContain('MaxStreamingBitrate=320000');
  });

  it('uses the item primary image when it has one', () => {
    const item: JellyfinItem = {
      Id: 'i1',
      Name: 'x',
      Type: 'Audio',
      ImageTags: { Primary: 'tag' },
    };
    const url = imageUrl(item)!;
    expect(url).toContain('/Items/i1/Images/Primary');
    // Tag present → Jellyfin serves it immutable (1yr cache), so scroll-backs
    // don't re-request; quality trims bytes.
    expect(url).toContain('tag=tag');
    expect(url).toContain('quality=90');
  });

  it('falls back to the album image for a track without its own (no tag — unknown)', () => {
    const item: JellyfinItem = { Id: 'i1', Name: 'x', Type: 'Audio', AlbumId: 'alb1' };
    const url = imageUrl(item)!;
    expect(url).toContain('/Items/alb1/Images/Primary');
    // We don't have the album's Primary tag here, so none is sent (the item's
    // own tag would be wrong for the album's image).
    expect(url).not.toContain('tag=');
    expect(url).toContain('quality=90');
  });

  it('returns null when there is no art at all', () => {
    expect(imageUrl({ Id: 'i1', Name: 'x', Type: 'Audio' })).toBeNull();
  });
});
