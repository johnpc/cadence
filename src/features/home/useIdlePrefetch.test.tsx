import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIdlePrefetch } from './useIdlePrefetch';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'MusicAlbum' });

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('useIdlePrefetch', () => {
  it('prefetches the item via requestIdleCallback when available', () => {
    const ric = vi.fn((cb: IdleRequestCallback) => {
      cb({} as IdleDeadline);
      return 7;
    });
    vi.stubGlobal('requestIdleCallback', ric);
    vi.stubGlobal('cancelIdleCallback', vi.fn());
    const prefetch = vi.fn();
    renderHook(() => useIdlePrefetch(item('a'), prefetch));
    expect(ric).toHaveBeenCalledOnce();
    expect(prefetch).toHaveBeenCalledWith(item('a'));
  });

  it('cancels the idle callback on unmount', () => {
    const cancel = vi.fn();
    vi.stubGlobal(
      'requestIdleCallback',
      vi.fn(() => 42),
    );
    vi.stubGlobal('cancelIdleCallback', cancel);
    const { unmount } = renderHook(() => useIdlePrefetch(item('a'), vi.fn()));
    unmount();
    expect(cancel).toHaveBeenCalledWith(42);
  });

  it('falls back to a timeout when requestIdleCallback is absent', () => {
    vi.stubGlobal('requestIdleCallback', undefined);
    vi.useFakeTimers();
    const prefetch = vi.fn();
    renderHook(() => useIdlePrefetch(item('a'), prefetch));
    expect(prefetch).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1500);
    expect(prefetch).toHaveBeenCalledWith(item('a'));
  });

  it('does nothing when there is no item to warm', () => {
    const ric = vi.fn();
    vi.stubGlobal('requestIdleCallback', ric);
    const prefetch = vi.fn();
    renderHook(() => useIdlePrefetch(undefined, prefetch));
    expect(ric).not.toHaveBeenCalled();
    expect(prefetch).not.toHaveBeenCalled();
  });
});
