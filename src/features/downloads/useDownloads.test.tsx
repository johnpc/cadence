import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Capture the change listener so the test can fire it deterministically.
let fire: () => void = () => {};
vi.mock('./downloadStore', () => ({
  onDownloadsChange: (l: () => void) => {
    fire = l;
    return () => {};
  },
}));
import { useDownloads } from './useDownloads';
import { addToIndex } from './downloadIndex';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track = (Id: string): JellyfinItem => ({ Id, Name: Id }) as JellyfinItem;

describe('useDownloads', () => {
  afterEach(() => {
    localStorage.clear();
    vi.resetAllMocks();
  });

  it('reads the current index on mount', () => {
    addToIndex(track('a'));
    const { result } = renderHook(() => useDownloads());
    expect(result.current.tracks.map((t) => t.Id)).toEqual(['a']);
  });

  it('re-reads the index when the store emits a change', () => {
    const { result } = renderHook(() => useDownloads());
    expect(result.current.tracks).toEqual([]);
    act(() => {
      addToIndex(track('b'));
      fire(); // the store notifies subscribers after a download/remove
    });
    expect(result.current.tracks.map((t) => t.Id)).toEqual(['b']);
  });
});
