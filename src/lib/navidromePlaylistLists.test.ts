import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./navidromeFetch', () => ({ request: vi.fn() }));

import { request } from './navidromeFetch';
import { setSession } from './sessionStore';
import {
  getPlaylists,
  getPublicPlaylists,
  getPlaylist,
  getPlaylistItems,
} from './navidromePlaylistLists';

const mockedRequest = vi.mocked(request);
const session = { username: 'me', userId: 'u1', subsonicSalt: 's', subsonicToken: 't' };

describe('navidromePlaylistLists', () => {
  afterEach(() => {
    setSession(null);
    vi.clearAllMocks();
  });

  it('getPlaylists keeps only playlists owned by the current user', async () => {
    setSession(session);
    mockedRequest.mockResolvedValue({
      playlists: {
        playlist: [
          {
            id: 'p1',
            name: 'Mine',
            owner: 'me',
            public: false,
            songCount: 1,
            duration: 1,
            created: '2024-01-02',
          },
          {
            id: 'p2',
            name: 'Theirs',
            owner: 'someone',
            public: true,
            songCount: 1,
            duration: 1,
            created: '2024-01-01',
          },
        ],
      },
    });
    const playlists = await getPlaylists();
    expect(playlists).toEqual([
      expect.objectContaining({ Id: 'p1', Name: 'Mine', CanDelete: true }),
    ]);
  });

  it('getPublicPlaylists keeps others’ playlists, newest first, capped at limit', async () => {
    setSession(session);
    mockedRequest.mockResolvedValue({
      playlists: {
        playlist: [
          {
            id: 'p1',
            name: 'Mine',
            owner: 'me',
            public: false,
            songCount: 1,
            duration: 1,
            created: '2024-01-03',
          },
          {
            id: 'p2',
            name: 'Older',
            owner: 'someone',
            public: true,
            songCount: 1,
            duration: 1,
            created: '2024-01-01',
          },
          {
            id: 'p3',
            name: 'Newer',
            owner: 'someone',
            public: true,
            songCount: 1,
            duration: 1,
            created: '2024-01-02',
          },
        ],
      },
    });
    const playlists = await getPublicPlaylists(1);
    expect(playlists).toEqual([expect.objectContaining({ Id: 'p3', Name: 'Newer' })]);
  });

  it('getPlaylist maps a single playlist by id', async () => {
    setSession(session);
    mockedRequest.mockResolvedValue({
      playlist: {
        id: 'p1',
        name: 'Mix',
        owner: 'me',
        public: false,
        songCount: 2,
        duration: 1,
        created: '',
      },
    });
    const playlist = await getPlaylist('p1');
    expect(request).toHaveBeenCalledWith('/getPlaylist', { params: { id: 'p1' } });
    expect(playlist).toMatchObject({ Id: 'p1', Name: 'Mix', Type: 'Playlist', CanDelete: true });
  });

  it('getPlaylistItems maps entries with PlaylistItemId = stringified index', async () => {
    setSession(session);
    mockedRequest.mockResolvedValue({
      playlist: {
        id: 'p1',
        name: 'Mix',
        owner: 'me',
        public: false,
        songCount: 2,
        duration: 1,
        created: '',
        entry: [
          { id: 's1', title: 'A' },
          { id: 's2', title: 'B' },
        ],
      },
    });
    const tracks = await getPlaylistItems('p1');
    expect(tracks.map((t) => t.PlaylistItemId)).toEqual(['0', '1']);
  });
});
