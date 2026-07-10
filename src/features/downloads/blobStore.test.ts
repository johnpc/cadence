import { afterEach, describe, expect, it, vi } from 'vitest';

const { isNativePlatform } = vi.hoisted(() => ({ isNativePlatform: vi.fn() }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform } }));
vi.mock('./cacheBlobStore', () => ({ cacheBlobStore: { _kind: 'cache' } }));
vi.mock('./filesystemBlobStore', () => ({ filesystemBlobStore: { _kind: 'filesystem' } }));

import { selectBlobStore } from './blobStore';

const kind = (s: unknown): string => (s as { _kind: string })._kind;

describe('selectBlobStore', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('uses the filesystem backend on native (never-evicted storage)', () => {
    isNativePlatform.mockReturnValue(true);
    expect(kind(selectBlobStore())).toBe('filesystem');
  });

  it('uses the Cache Storage backend on web/PWA', () => {
    isNativePlatform.mockReturnValue(false);
    expect(kind(selectBlobStore())).toBe('cache');
  });
});
