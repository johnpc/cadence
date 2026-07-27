import { describe, expect, it, vi } from 'vitest';

vi.mock('./navidromeFetch', async () => {
  const actual = await vi.importActual<typeof import('./navidromeFetch')>('./navidromeFetch');
  return { ...actual, request: vi.fn() };
});

import { request, Unauthenticated } from './navidromeFetch';
import { getLyrics } from './navidromeLyrics';

const mockedRequest = vi.mocked(request);

describe('getLyrics', () => {
  it('returns plain lines (no start) for unsynced lyrics', async () => {
    mockedRequest.mockResolvedValue({
      lyricsList: { structuredLyrics: [{ synced: false, line: [{ value: 'line one' }] }] },
    });
    expect(await getLyrics('s1')).toEqual([{ text: 'line one', start: undefined }]);
  });

  it('converts start ms to seconds for synced lyrics', async () => {
    mockedRequest.mockResolvedValue({
      lyricsList: {
        structuredLyrics: [
          {
            synced: true,
            line: [
              { value: 'intro', start: 0 },
              { value: 'verse', start: 3280 },
            ],
          },
        ],
      },
    });
    expect(await getLyrics('s1')).toEqual([
      { text: 'intro', start: undefined },
      { text: 'verse', start: 3.28 },
    ]);
  });

  it('ignores start offsets on an unsynced entry', async () => {
    mockedRequest.mockResolvedValue({
      lyricsList: { structuredLyrics: [{ synced: false, line: [{ value: 'x', start: 1000 }] }] },
    });
    expect(await getLyrics('s1')).toEqual([{ text: 'x', start: undefined }]);
  });

  it('returns [] when there are no lyrics', async () => {
    mockedRequest.mockResolvedValue({ lyricsList: {} });
    expect(await getLyrics('s1')).toEqual([]);
  });

  it('rethrows Unauthenticated', async () => {
    mockedRequest.mockRejectedValue(new Unauthenticated());
    await expect(getLyrics('s1')).rejects.toBeInstanceOf(Unauthenticated);
  });
});
