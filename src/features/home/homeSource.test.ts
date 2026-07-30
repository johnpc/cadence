import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinFetch', () => ({ request: vi.fn() }));
vi.mock('../../lib/runtimeConfig', () => ({ homeShelvesEnabled: vi.fn() }));

import { request } from '../../lib/jellyfinFetch';
import { homeShelvesEnabled } from '../../lib/runtimeConfig';
import { fetchHomeShelves, homeSourceEnabled } from './homeSource';

afterEach(() => {
  vi.resetAllMocks();
});

describe('homeSource', () => {
  it('homeSourceEnabled mirrors the plugin config flag', () => {
    vi.mocked(homeShelvesEnabled).mockReturnValue(true);
    expect(homeSourceEnabled()).toBe(true);
    vi.mocked(homeShelvesEnabled).mockReturnValue(false);
    expect(homeSourceEnabled()).toBe(false);
  });

  it('maps the PascalCase plugin payload to the shelf shape', async () => {
    vi.mocked(request).mockResolvedValue({
      LatestAlbums: [{ Id: 'a', Name: 'A', Type: 'MusicAlbum' }],
      SuggestedSongs: [{ Id: 's', Name: 'S', Type: 'Audio' }],
      SavedAlbums: [{ Id: 'sa', Name: 'SA', Type: 'MusicAlbum' }],
      RecentlyPlayed: [{ Id: 'r', Name: 'R', Type: 'Audio' }],
      OnRepeat: [{ Id: 'o', Name: 'O', Type: 'Audio' }],
      FollowedArtists: [{ Id: 'ar', Name: 'AR', Type: 'MusicArtist' }],
    });
    const data = await fetchHomeShelves();
    expect(request).toHaveBeenCalledWith('/Cadence/Home');
    expect(data.latestAlbums[0].Id).toBe('a');
    expect(data.suggestedSongs[0].Id).toBe('s');
    expect(data.savedAlbums[0].Id).toBe('sa');
    expect(data.recentlyPlayed[0].Id).toBe('r');
    expect(data.onRepeat[0].Id).toBe('o');
    expect(data.followedArtists[0].Id).toBe('ar');
  });

  it('degrades a partial/empty payload to empty shelves (never throws)', async () => {
    vi.mocked(request).mockResolvedValue({ LatestAlbums: [{ Id: 'a', Name: 'A', Type: 'x' }] });
    const data = await fetchHomeShelves();
    expect(data.latestAlbums).toHaveLength(1);
    // Missing fields become [] rather than undefined.
    expect(data.suggestedSongs).toEqual([]);
    expect(data.savedAlbums).toEqual([]);
    expect(data.followedArtists).toEqual([]);
  });

  it('coerces a non-array field to an empty array', async () => {
    // A malformed payload (wrong type) must not crash the mapper.
    vi.mocked(request).mockResolvedValue({ LatestAlbums: 'oops' });
    const data = await fetchHomeShelves();
    expect(data.latestAlbums).toEqual([]);
  });
});
