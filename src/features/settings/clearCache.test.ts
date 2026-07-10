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
});

describe('clearCache', () => {
  it('clears the react-query cache then refetches active queries', async () => {
    const client = stubClient();
    await clearCache(client);
    expect(client.clear).toHaveBeenCalledOnce();
    expect(client.refetchQueries).toHaveBeenCalledOnce();
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
