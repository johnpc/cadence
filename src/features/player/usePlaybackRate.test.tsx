import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { usePlaybackRate } from './usePlaybackRate';

function audioRef(): { current: HTMLAudioElement } {
  return { current: { playbackRate: 1 } as HTMLAudioElement };
}

describe('usePlaybackRate', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('defaults to 1× and applies it to the element', () => {
    const ref = audioRef();
    const { result } = renderHook(() => usePlaybackRate(ref, 't1'));
    expect(result.current.rate).toBe(1);
    expect(ref.current.playbackRate).toBe(1);
  });

  it('sets and persists a supported rate, applying it to the element', () => {
    const ref = audioRef();
    const { result } = renderHook(() => usePlaybackRate(ref, 't1'));
    act(() => result.current.setRate(1.5));
    expect(result.current.rate).toBe(1.5);
    expect(ref.current.playbackRate).toBe(1.5);
    expect(localStorage.getItem('cadence.playbackRate')).toBe('1.5');
  });

  it('ignores an unsupported rate (falls back to 1×)', () => {
    const { result } = renderHook(() => usePlaybackRate(audioRef(), 't1'));
    act(() => result.current.setRate(3));
    expect(result.current.rate).toBe(1);
  });

  it('restores the persisted rate on mount', () => {
    localStorage.setItem('cadence.playbackRate', '0.75');
    const { result } = renderHook(() => usePlaybackRate(audioRef(), 't1'));
    expect(result.current.rate).toBe(0.75);
  });

  it('ignores a persisted garbage value', () => {
    localStorage.setItem('cadence.playbackRate', 'fast');
    const { result } = renderHook(() => usePlaybackRate(audioRef(), 't1'));
    expect(result.current.rate).toBe(1);
  });

  it('re-applies the rate when the track changes (fresh src resets it)', () => {
    const ref = audioRef();
    const { result, rerender } = renderHook(({ id }) => usePlaybackRate(ref, id), {
      initialProps: { id: 't1' },
    });
    act(() => result.current.setRate(2));
    ref.current.playbackRate = 1; // simulate a new src resetting the element
    rerender({ id: 't2' });
    expect(ref.current.playbackRate).toBe(2);
  });
});
