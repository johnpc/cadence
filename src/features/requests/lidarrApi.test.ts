import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchArtists, getAddDefaults, requestArtist } from './lidarrApi';
import type { LidarrArtist } from './lidarrTypes';

function stub(bodyByUrl: (url: string) => { ok?: boolean; status?: number; json: unknown }) {
  const f = vi.fn((url: string, _init?: RequestInit) => {
    const r = bodyByUrl(url);
    return Promise.resolve({
      ok: r.ok ?? true,
      status: r.status ?? 200,
      json: async () => r.json,
    } as Response);
  });
  vi.stubGlobal('fetch', f);
  return f;
}

afterEach(() => {
  vi.restoreAllMocks();
});

const artist: LidarrArtist = { artistName: 'Radiohead', foreignArtistId: 'mb-1' };

describe('lidarrApi', () => {
  it('searchArtists returns only artist matches with a MusicBrainz id', async () => {
    const f = stub(() => ({
      json: [
        { foreignId: '1', artist: { artistName: 'Radiohead', foreignArtistId: 'mb-1' } },
        { foreignId: '2', album: { title: 'OK Computer', foreignAlbumId: 'al-1' } },
        { foreignId: '3', artist: { artistName: 'No Id' } }, // dropped: no foreignArtistId
      ],
    }));
    const out = await searchArtists('radiohead');
    expect(out.map((a) => a.artistName)).toEqual(['Radiohead']);
    expect(f.mock.calls[0][0] as string).toContain('/api/lidarr/search?term=radiohead');
  });

  it('searchArtists short-circuits on an empty term (no request)', async () => {
    const f = stub(() => ({ json: [] }));
    expect(await searchArtists('   ')).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });

  it('getAddDefaults picks the first root folder + profiles', async () => {
    stub((url) => {
      if (url.includes('/rootfolder')) return { json: [{ id: 1, path: '/music' }] };
      if (url.includes('/qualityprofile')) return { json: [{ id: 2, name: 'Lossless' }] };
      return { json: [{ id: 3, name: 'Standard' }] }; // metadataprofile
    });
    expect(await getAddDefaults()).toEqual({
      rootFolderPath: '/music',
      qualityProfileId: 2,
      metadataProfileId: 3,
    });
  });

  it('getAddDefaults throws when a profile or root folder is missing', async () => {
    stub((url) => (url.includes('/rootfolder') ? { json: [] } : { json: [{ id: 1 }] }));
    await expect(getAddDefaults()).rejects.toThrow(/root folder or profile/);
  });

  it('requestArtist POSTs the artist monitored + search, and returns it', async () => {
    const f = stub(() => ({ json: { id: 9, ...artist, monitored: true } }));
    const defaults = { rootFolderPath: '/music', qualityProfileId: 2, metadataProfileId: 3 };
    const added = await requestArtist(artist, defaults);
    expect(added.id).toBe(9);
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/api/lidarr/artist');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body).toMatchObject({
      foreignArtistId: 'mb-1',
      monitored: true,
      rootFolderPath: '/music',
      addOptions: { searchForMissingAlbums: true },
    });
  });

  it('requestArtist throws on a non-ok response (e.g. already added)', async () => {
    stub(() => ({ ok: false, status: 400, json: {} }));
    await expect(
      requestArtist(artist, { rootFolderPath: '/m', qualityProfileId: 1, metadataProfileId: 1 }),
    ).rejects.toThrow(/add failed: 400/);
  });
});
