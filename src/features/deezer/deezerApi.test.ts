import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { importDeezerPlaylist } from './deezerApi';
import { setSession } from '../../lib/sessionStore';

beforeEach(() => {
  vi.stubEnv('VITE_JELLYFIN_URL', 'https://jf.example.com');
  setSession({ token: 'tok', userId: 'user-1' });
});

afterEach(() => {
  setSession(null);
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('importDeezerPlaylist', () => {
  it('POSTs userId + parsed id and returns the result', async () => {
    const body = {
      PlaylistId: 'pl1',
      PlaylistName: 'En mode 60',
      AddedCount: 4,
      TotalCount: 50,
      MissingArtists: ['The Beatles'],
    };
    const f = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => body,
    } as Response);
    vi.stubGlobal('fetch', f);

    const result = await importDeezerPlaylist('https://www.deezer.com/playlist/908622995');

    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/Cadence/Deezer/Import');
    expect(url).toContain('userId=user-1');
    expect(url).toContain('url=908622995'); // parsed to the bare id
    expect((init as RequestInit).method).toBe('POST');
    // Auth rides in the header, never a query param.
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: 'MediaBrowser Token="tok"',
    });
    expect(result).toEqual(body);
  });

  it('rejects an input that is not a Deezer playlist before any fetch', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    await expect(importDeezerPlaylist('not-a-link')).rejects.toThrow(/Deezer playlist link/);
    expect(f).not.toHaveBeenCalled();
  });

  it('requires a signed-in session', async () => {
    setSession(null);
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    await expect(importDeezerPlaylist('908622995')).rejects.toThrow(/Sign in/);
    expect(f).not.toHaveBeenCalled();
  });

  it('maps a 400 to a public-playlist hint', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 400 } as Response));
    await expect(importDeezerPlaylist('908622995')).rejects.toThrow(/public on Deezer/);
  });

  it('throws on any other non-2xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response));
    await expect(importDeezerPlaylist('908622995')).rejects.toThrow(/500/);
  });

  it('propagates a network/abort failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')));
    await expect(importDeezerPlaylist('908622995')).rejects.toThrow();
  });
});
