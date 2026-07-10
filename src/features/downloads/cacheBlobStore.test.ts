import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cacheBlobStore } from './cacheBlobStore';

/** A minimal in-memory Cache Storage: one bucket, key → Response. */
function fakeCaches() {
  const s = new Map<string, Response>();
  return {
    open: vi.fn().mockResolvedValue({
      match: (k: string) => Promise.resolve(s.get(k)),
      put: (k: string, res: Response) => {
        s.set(k, res);
        return Promise.resolve();
      },
      delete: (k: string) => Promise.resolve(s.delete(k)),
    }),
  };
}

describe('cacheBlobStore', () => {
  beforeEach(() => {
    vi.stubGlobal('caches', fakeCaches());
    let n = 0;
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => `blob:mock/${n++}`),
      revokeObjectURL: vi.fn(),
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns null for a track that was never stored', async () => {
    expect(await cacheBlobStore.blobUrl('a')).toBeNull();
  });

  it('stores a blob and hands back a memoised object URL', async () => {
    await cacheBlobStore.putBlob('a', new Blob(['bytes']));
    const url = await cacheBlobStore.blobUrl('a');
    expect(url).toMatch(/^blob:mock\//);
    expect(await cacheBlobStore.blobUrl('a')).toBe(url); // memoised
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
  });

  it('removes a stored blob and revokes its object URL', async () => {
    await cacheBlobStore.putBlob('a', new Blob(['bytes']));
    await cacheBlobStore.blobUrl('a'); // materialise the URL
    await cacheBlobStore.removeBlob('a');
    expect(URL.revokeObjectURL).toHaveBeenCalledOnce();
    expect(await cacheBlobStore.blobUrl('a')).toBeNull();
  });
});
