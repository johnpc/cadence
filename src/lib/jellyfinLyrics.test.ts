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

  it('returns plain lines (no start) when the track has unsynced lyrics', async () => {
    setSession({ token: 't', userId: 'uid' });
    stub(200, { Lyrics: [{ Text: 'line one' }, { Text: 'line two' }] });
    expect(await getLyrics('s1')).toEqual([
      { text: 'line one', start: undefined },
      { text: 'line two', start: undefined },
    ]);
  });

  it('converts Start ticks to seconds for synced (LRC) lyrics', async () => {
    setSession({ token: 't', userId: 'uid' });
    // 32,800,000 ticks = 3.28s; a leading 0-tick line stays unsynced.
    stub(200, {
      Lyrics: [
        { Text: 'intro', Start: 0 },
        { Text: 'verse', Start: 32_800_000 },
      ],
    });
    expect(await getLyrics('s1')).toEqual([
      { text: 'intro', start: undefined },
      { text: 'verse', start: 3.28 },
    ]);
  });

  it('returns [] when there are no lyrics (404)', async () => {
    setSession({ token: 't', userId: 'uid' });
    stub(404);
    expect(await getLyrics('s1')).toEqual([]);
  });
});
