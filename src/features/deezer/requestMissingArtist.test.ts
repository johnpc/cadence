import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestMissingArtist } from './requestMissingArtist';
import * as lidarrApi from '../requests/lidarrApi';

afterEach(() => {
  vi.restoreAllMocks();
});

const ARTIST = {
  artistName: 'The Beatles',
  foreignArtistId: 'mbid-1',
};

describe('requestMissingArtist', () => {
  it('searches by name and requests the top match', async () => {
    vi.spyOn(lidarrApi, 'searchArtists').mockResolvedValue([ARTIST, { ...ARTIST }] as never);
    vi.spyOn(lidarrApi, 'getAddDefaults').mockResolvedValue({
      rootFolderPath: '/music',
      qualityProfileId: 1,
      metadataProfileId: 1,
    });
    const req = vi.spyOn(lidarrApi, 'requestArtist').mockResolvedValue(ARTIST as never);

    await requestMissingArtist('The Beatles');

    expect(lidarrApi.searchArtists).toHaveBeenCalledWith('The Beatles');
    expect(req).toHaveBeenCalledWith(ARTIST, expect.objectContaining({ rootFolderPath: '/music' }));
  });

  it('throws when the name resolves to no artist', async () => {
    vi.spyOn(lidarrApi, 'searchArtists').mockResolvedValue([]);
    await expect(requestMissingArtist('Nobody')).rejects.toThrow(/No Lidarr match/);
  });

  it('treats an already-added artist as success', async () => {
    vi.spyOn(lidarrApi, 'searchArtists').mockResolvedValue([ARTIST] as never);
    vi.spyOn(lidarrApi, 'getAddDefaults').mockResolvedValue({
      rootFolderPath: '/music',
      qualityProfileId: 1,
      metadataProfileId: 1,
    });
    vi.spyOn(lidarrApi, 'requestArtist').mockRejectedValue(new lidarrApi.AlreadyAddedError());
    await expect(requestMissingArtist('The Beatles')).resolves.toBeUndefined();
  });

  it('propagates a genuine request failure', async () => {
    vi.spyOn(lidarrApi, 'searchArtists').mockResolvedValue([ARTIST] as never);
    vi.spyOn(lidarrApi, 'getAddDefaults').mockResolvedValue({
      rootFolderPath: '/music',
      qualityProfileId: 1,
      metadataProfileId: 1,
    });
    vi.spyOn(lidarrApi, 'requestArtist').mockRejectedValue(new Error('lidarr add failed: 500'));
    await expect(requestMissingArtist('The Beatles')).rejects.toThrow(/500/);
  });
});
