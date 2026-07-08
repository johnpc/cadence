import { afterEach, describe, expect, it, vi } from 'vitest';
import { jellyfinSearchSource } from './searchSource';
import { setSession } from '../../lib/sessionStore';

describe('jellyfinSearchSource', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('queries both /Items (songs+albums) and /Artists, merging + tagging artists', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = vi.fn().mockImplementation((url: string) => {
      const items = url.includes('/Artists')
        ? [{ Id: 'ar', Name: 'An Artist' }] // note: no Type from the Artists endpoint
        : [
            { Id: 's', Name: 'Song', Type: 'Audio' },
            { Id: 'al', Name: 'Album', Type: 'MusicAlbum' },
          ];
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ Items: items }),
      } as Response);
    });
    vi.stubGlobal('fetch', f);

    const results = await jellyfinSearchSource('love', 10);

    const urls = f.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes('/Items?') && u.includes('IncludeItemTypes=Audio'))).toBe(
      true,
    );
    expect(urls.some((u) => u.includes('/Artists?'))).toBe(true);
    // Artists get tagged so the grouping can find them.
    expect(results.find((r) => r.Id === 'ar')?.Type).toBe('MusicArtist');
    expect(results.map((r) => r.Type).sort()).toEqual(['Audio', 'MusicAlbum', 'MusicArtist']);
  });
});
