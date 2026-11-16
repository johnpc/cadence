import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./jellyfinFetch', () => ({ request: vi.fn() }));
import { request } from './jellyfinFetch';
import { HttpError, RequestTimeout } from './jellyfinErrors';
import { setSession } from './sessionStore';
import {
  isPlaylistOwner,
  rememberOwnPlaylist,
  __resetPlaylistOwnership,
} from './playlistOwnership';

const ownerOf = (owned: string[]) =>
  vi.mocked(request).mockImplementation((path: string) => {
    const id = path.match(/\/Playlists\/([^/]+)\/Users/)?.[1] ?? '';
    return owned.includes(id) ? Promise.resolve(undefined) : Promise.reject(new HttpError(403));
  });

describe('playlistOwnership', () => {
  beforeEach(() => setSession({ token: 't', userId: 'u1' }));
  afterEach(() => {
    vi.resetAllMocks();
    __resetPlaylistOwnership();
    localStorage.clear();
    setSession(null);
  });

  it('200 is mine, 403 is not, and both are remembered on disk', async () => {
    ownerOf(['a']);
    expect(await isPlaylistOwner('a')).toBe(true);
    expect(await isPlaylistOwner('b')).toBe(false);
    __resetPlaylistOwnership(); // a relaunch: memory gone, disk kept
    expect(await isPlaylistOwner('a')).toBe(true);
    expect(await isPlaylistOwner('b')).toBe(false);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('shares one request between concurrent asks', async () => {
    ownerOf(['a']);
    const [x, y] = await Promise.all([isPlaylistOwner('a'), isPlaylistOwner('a')]);
    expect([x, y]).toEqual([true, true]);
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('an indefinite answer reads as not-mine but is asked again next time', async () => {
    vi.mocked(request).mockRejectedValueOnce(new RequestTimeout());
    expect(await isPlaylistOwner('a')).toBe(false);
    vi.mocked(request).mockRejectedValueOnce(new HttpError(500));
    expect(await isPlaylistOwner('a')).toBe(false);
    vi.mocked(request).mockResolvedValueOnce(undefined);
    expect(await isPlaylistOwner('a')).toBe(true);
    expect(request).toHaveBeenCalledTimes(3);
  });

  it('answers are per user — another account never sees them', async () => {
    ownerOf(['a']);
    expect(await isPlaylistOwner('a')).toBe(true);
    setSession({ token: 't2', userId: 'u2' });
    ownerOf([]);
    expect(await isPlaylistOwner('a')).toBe(false);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it('a playlist the user created is theirs without a probe', async () => {
    rememberOwnPlaylist('new');
    expect(await isPlaylistOwner('new')).toBe(true);
    expect(request).not.toHaveBeenCalled();
  });

  it('ignores a record without a user or id', async () => {
    setSession(null);
    rememberOwnPlaylist('x');
    rememberOwnPlaylist('');
    expect(localStorage.length).toBe(0);
  });

  it('survives corrupt or unavailable storage', async () => {
    localStorage.setItem('cadence.playlist-ownership.u1', '{not json');
    ownerOf(['a']);
    expect(await isPlaylistOwner('a')).toBe(true);
    __resetPlaylistOwnership();
    localStorage.setItem('cadence.playlist-ownership.u1', 'null');
    expect(await isPlaylistOwner('a')).toBe(true);
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(await isPlaylistOwner('b')).toBe(false); // still answers this run
    set.mockRestore();
  });
});
