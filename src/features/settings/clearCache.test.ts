import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearCache } from './clearCache';

function stubClient() {
  return {
    clear: vi.fn(),
    refetchQueries: vi.fn().mockResolvedValue(undefined),
  } as unknown as import('@tanstack/react-query').QueryClient;
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('clearCache', () => {
  it('clears the react-query cache then refetches active queries', async () => {
    const client = stubClient();
    await clearCache(client);
    expect(client.clear).toHaveBeenCalledOnce();
    expect(client.refetchQueries).toHaveBeenCalledOnce();
  });

  it('flushes the persisted playlist-items disk cache', async () => {
    localStorage.setItem('cadence.playlist-items', JSON.stringify({ p1: { at: 1, tracks: [] } }));
    await clearCache(stubClient());
    expect(localStorage.getItem('cadence.playlist-items')).toBeNull();
  });

  it('leaves session/settings keys untouched (never signs the user out)', async () => {
    localStorage.setItem('cadence.server-url', 'https://jf.example.com');
    localStorage.setItem('cadence.playlist-items', '{}');
    await clearCache(stubClient());
    expect(localStorage.getItem('cadence.server-url')).toBe('https://jf.example.com');
    expect(localStorage.getItem('cadence.playlist-items')).toBeNull();
  });

  it('deletes every Cache Storage bucket when available', async () => {
    const del = vi.fn().mockResolvedValue(true);
    vi.stubGlobal('caches', { keys: vi.fn().mockResolvedValue(['v1', 'imgs']), delete: del });
    await clearCache(stubClient());
    expect(del).toHaveBeenCalledWith('v1');
    expect(del).toHaveBeenCalledWith('imgs');
  });

  it('still refetches when Cache Storage throws (best-effort)', async () => {
    vi.stubGlobal('caches', {
      keys: vi.fn().mockRejectedValue(new Error('blocked')),
      delete: vi.fn(),
    });
    const client = stubClient();
    await expect(clearCache(client)).resolves.toBeUndefined();
    expect(client.refetchQueries).toHaveBeenCalledOnce();
  });
});
