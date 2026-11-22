import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinFetch', () => ({ request: vi.fn() }));
vi.mock('../../lib/sessionStore', () => ({
  getSession: () => ({ token: 'tok', userId: 'u1' }),
}));
vi.mock('../../lib/jellyfinConfig', () => ({
  apiUrl: (p: string) => `https://jf${p}`,
  authHeaders: (t?: string) => ({ Authorization: `MediaBrowser Token="${t}"` }),
}));
import { request } from '../../lib/jellyfinFetch';
import {
  chapterResourceUrl,
  getChapterText,
  getReadAlongBook,
  getSharedPosition,
} from './storytellerApi';

describe('storytellerApi', () => {
  beforeEach(() => {
    vi.mocked(request).mockReset();
  });

  it('fetches a book by part id, encoding it', async () => {
    vi.mocked(request).mockResolvedValue({ Status: 'ready' });
    await getReadAlongBook('a b');
    expect(request).toHaveBeenCalledWith('/Cadence/Storyteller/Books/a%20b');
  });

  it('builds proxied resource URLs, with the ApiKey only when asked', () => {
    expect(chapterResourceUrl('id1', 'OEBPS/text/ch 1.xhtml')).toBe(
      'https://jf/Cadence/Storyteller/Books/id1/Text/OEBPS/text/ch%201.xhtml',
    );
    expect(chapterResourceUrl('id1', 'img/a.png', true)).toBe(
      'https://jf/Cadence/Storyteller/Books/id1/Text/img/a.png?ApiKey=tok',
    );
  });

  it('returns null for a 204 position (neither side has one)', async () => {
    vi.mocked(request).mockResolvedValue(undefined);
    expect(await getSharedPosition('id1')).toBeNull();
    vi.mocked(request).mockResolvedValue({ Seconds: 1, Timestamp: 2, Source: 'storyteller' });
    expect(await getSharedPosition('id1')).toEqual({
      Seconds: 1,
      Timestamp: 2,
      Source: 'storyteller',
    });
  });

  it('fetches chapter text with the auth header and throws on a non-2xx', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('<p/>') });
    vi.stubGlobal('fetch', fetchMock);
    expect(await getChapterText('id1', 'ch.xhtml')).toBe('<p/>');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://jf/Cadence/Storyteller/Books/id1/Text/ch.xhtml',
      {
        headers: { Authorization: 'MediaBrowser Token="tok"' },
      },
    );
    fetchMock.mockResolvedValue({ ok: false, status: 502, text: () => Promise.resolve('') });
    await expect(getChapterText('id1', 'ch.xhtml')).rejects.toThrow('502');
    vi.unstubAllGlobals();
  });
});
