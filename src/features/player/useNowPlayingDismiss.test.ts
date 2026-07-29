import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useNowPlayingDismiss } from './useNowPlayingDismiss';

describe('useNowPlayingDismiss', () => {
  it('is not dismissed initially', () => {
    const { result } = renderHook(() => useNowPlayingDismiss('a'));
    expect(result.current.dismissed).toBe(false);
  });

  it('hides the current track when dismissed', () => {
    const { result } = renderHook(() => useNowPlayingDismiss('a'));
    act(() => result.current.dismiss());
    expect(result.current.dismissed).toBe(true);
  });

  it('reappears when a new track starts', () => {
    const { result, rerender } = renderHook(({ id }) => useNowPlayingDismiss(id), {
      initialProps: { id: 'a' },
    });
    act(() => result.current.dismiss());
    expect(result.current.dismissed).toBe(true);
    rerender({ id: 'b' }); // new track
    expect(result.current.dismissed).toBe(false);
  });

  it('stays dismissed while the same track keeps playing', () => {
    const { result, rerender } = renderHook(({ id }) => useNowPlayingDismiss(id), {
      initialProps: { id: 'a' },
    });
    act(() => result.current.dismiss());
    rerender({ id: 'a' }); // same track, just a re-render
    expect(result.current.dismissed).toBe(true);
  });

  it('is never dismissed when there is no current track', () => {
    const { result } = renderHook(() => useNowPlayingDismiss(undefined));
    act(() => result.current.dismiss());
    expect(result.current.dismissed).toBe(false);
  });
});
