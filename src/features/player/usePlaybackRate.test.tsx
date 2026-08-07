import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { usePlaybackRate, clampRate } from './usePlaybackRate';

describe('clampRate', () => {
  it('snaps to the nearest 0.25 step within [0.5, 3]', () => {
    expect(clampRate(1.6)).toBe(1.5);
    expect(clampRate(1.7)).toBe(1.75);
    expect(clampRate(2)).toBe(2);
  });
  it('clamps out-of-range values to the bounds', () => {
    expect(clampRate(4)).toBe(3);
    expect(clampRate(0.1)).toBe(0.5);
  });
  it('falls back to 1 for invalid input', () => {
    expect(clampRate(NaN)).toBe(1);
    expect(clampRate(0)).toBe(1);
    expect(clampRate(-2)).toBe(1);
  });
});

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

  it('clamps an out-of-range rate to the max (3×)', () => {
    const { result } = renderHook(() => usePlaybackRate(audioRef(), 't1'));
    act(() => result.current.setRate(4));
    expect(result.current.rate).toBe(3);
  });

  it('snaps an off-step rate to the nearest 0.25', () => {
    const { result } = renderHook(() => usePlaybackRate(audioRef(), 't1'));
    act(() => result.current.setRate(1.7));
    expect(result.current.rate).toBe(1.75);
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
