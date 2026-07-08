import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAudioItems } from './jellyfinItems';
import { setSession } from './sessionStore';

describe('jellyfinItems', () => {
  afterEach(() => {
    setSession(null);
    vi.restoreAllMocks();
  });

  it('getAudioItems requests audio tracks and returns the items', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({ Items: [{ Id: 'a', Name: 'x', Type: 'Audio' }], TotalRecordCount: 1 }),
    } as Response);
    vi.stubGlobal('fetch', f);
    const items = await getAudioItems(10);
    expect(items).toHaveLength(1);
    const [url] = f.mock.calls[0];
    expect(url).toContain('IncludeItemTypes=Audio');
    expect(url).toContain('Limit=10');
    expect(url).toContain('userId=uid');
  });
});
