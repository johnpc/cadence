import { afterEach, describe, expect, it } from 'vitest';
import { audioStreamUrl, imageUrl } from './jellyfinStream';
import { setSession } from './sessionStore';
import { getServerUrl } from './serverUrlStore';
import type { JellyfinItem } from './jellyfinTypes';

describe('jellyfinStream', () => {
  afterEach(() => setSession(null));

  it('builds an audio stream URL carrying the session token + user', () => {
    setSession({ token: 'tok', userId: 'uid' });
    const url = audioStreamUrl('song1');
    expect(url.startsWith(`${getServerUrl()}/Audio/song1/universal?`)).toBe(true);
    expect(url).toContain('api_key=tok');
    expect(url).toContain('UserId=uid');
  });

  it('uses the item primary image when it has one', () => {
    const item: JellyfinItem = {
      Id: 'i1',
      Name: 'x',
      Type: 'Audio',
      ImageTags: { Primary: 'tag' },
    };
    expect(imageUrl(item)).toContain('/Items/i1/Images/Primary');
  });

  it('falls back to the album image for a track without its own', () => {
    const item: JellyfinItem = { Id: 'i1', Name: 'x', Type: 'Audio', AlbumId: 'alb1' };
    expect(imageUrl(item)).toContain('/Items/alb1/Images/Primary');
  });

  it('returns null when there is no art at all', () => {
    expect(imageUrl({ Id: 'i1', Name: 'x', Type: 'Audio' })).toBeNull();
  });
});
