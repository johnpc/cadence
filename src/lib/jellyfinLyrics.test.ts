import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLyrics } from './jellyfinLyrics';
import { setSession } from './sessionStore';

function stub(status: number, body?: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      text: async () => (body === undefined ? '' : JSON.stringify(body)),
    } as Response),
  );
}

describe('getLyrics', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('returns the lyric line texts', async () => {
    setSession({ token: 't', userId: 'uid' });
    stub(200, { Lyrics: [{ Text: 'line one' }, { Text: 'line two', Start: 400 }] });
    expect(await getLyrics('s1')).toEqual(['line one', 'line two']);
  });

  it('returns [] when there are no lyrics (404)', async () => {
    setSession({ token: 't', userId: 'uid' });
    stub(404);
    expect(await getLyrics('s1')).toEqual([]);
  });
});
