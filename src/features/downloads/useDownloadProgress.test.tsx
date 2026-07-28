import { renderHook, act } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { useDownloadProgress } from './useDownloadProgress';
import { setProgress, clearProgress, __resetProgress } from './downloadProgress';

afterEach(() => __resetProgress());

describe('useDownloadProgress', () => {
  it('is undefined when the track is not downloading', () => {
    const { result } = renderHook(() => useDownloadProgress('a'));
    expect(result.current).toBeUndefined();
  });

  it('tracks the live fraction and clears when done', () => {
    const { result } = renderHook(() => useDownloadProgress('a'));
    act(() => setProgress('a', 0.5));
    expect(result.current).toBe(0.5);
    act(() => clearProgress('a'));
    expect(result.current).toBeUndefined();
  });

  it('ignores progress for other tracks', () => {
    const { result } = renderHook(() => useDownloadProgress('a'));
    act(() => setProgress('b', 0.9));
    expect(result.current).toBeUndefined();
  });
});
