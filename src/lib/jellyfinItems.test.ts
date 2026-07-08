import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAudioItems, getInstantMix, getItemTracks } from './jellyfinItems';
import { setSession } from './sessionStore';

function stubItems(items: unknown[]) {
  const f = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({ Items: items, TotalRecordCount: items.length }),
  } as Response);
  vi.stubGlobal('fetch', f);
  return f;
}

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

  it('getItemTracks requests a parent’s tracks in order', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stubItems([{ Id: 'a', Name: 'x', Type: 'Audio' }]);
    const items = await getItemTracks('album1');
    expect(items).toHaveLength(1);
    const [url] = f.mock.calls[0];
    expect(url).toContain('ParentId=album1');
    expect(url).toContain('IncludeItemTypes=Audio');
  });

  it('getInstantMix requests a radio seeded from an item', async () => {
    setSession({ token: 't', userId: 'uid' });
    const f = stubItems([{ Id: 'r', Name: 'x', Type: 'Audio' }]);
    const items = await getInstantMix('seed1', 20);
    expect(items).toHaveLength(1);
    const [url] = f.mock.calls[0];
    expect(url).toContain('/Items/seed1/InstantMix');
    expect(url).toContain('Limit=20');
  });
});
