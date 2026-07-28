import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// In-memory blob backend so downloadStore's index writes work without a real
// Cache/Filesystem backend.
const backing = new Map<string, Blob>();
vi.mock('./blobStore', () => ({
  selectBlobStore: () => ({
    putBlob: async (id: string, b: Blob) => void backing.set(id, b),
    blobUrl: async (id: string) => (backing.has(id) ? `blob:${id}` : null),
    removeBlob: async (id: string) => void backing.delete(id),
  }),
}));

import { useTrackBadge } from './useTrackBadge';
import { addToIndex, removeFromIndex } from './downloadIndex';
import { emitDownloadsChange } from './downloadEmitter';
import { setProgress, clearProgress, __resetProgress } from './downloadProgress';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (Id: string): JellyfinItem => ({ Id, Name: Id }) as JellyfinItem;

afterEach(() => {
  __resetProgress();
  localStorage.clear();
  backing.clear();
});

describe('useTrackBadge', () => {
  it('is none for an untouched track', () => {
    const { result } = renderHook(() => useTrackBadge('a'));
    expect(result.current).toEqual({ status: 'none' });
  });

  it('reflects a live download fraction', () => {
    const { result } = renderHook(() => useTrackBadge('a'));
    act(() => setProgress('a', 0.3));
    expect(result.current).toEqual({ status: 'downloading', fraction: 0.3 });
  });

  it('shows downloaded once indexed (and prefers it over progress)', () => {
    const { result } = renderHook(() => useTrackBadge('a'));
    act(() => {
      addToIndex(track('a'));
      emitDownloadsChange();
    });
    expect(result.current).toEqual({ status: 'downloaded' });
  });

  it('returns to none after removal and progress clear', () => {
    const { result } = renderHook(() => useTrackBadge('a'));
    act(() => {
      addToIndex(track('a'));
      emitDownloadsChange();
    });
    act(() => {
      removeFromIndex('a');
      emitDownloadsChange();
      clearProgress('a');
    });
    expect(result.current).toEqual({ status: 'none' });
  });
});
