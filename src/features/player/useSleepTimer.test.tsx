import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSleepTimer } from './useSleepTimer';

/** A stand-in for the ended-handler's "stop after track" ref. */
function trackRef() {
  return { current: false };
}

describe('useSleepTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts unset', () => {
    const { result } = renderHook(() => useSleepTimer(vi.fn(), trackRef()));
    expect(result.current.sleepMode).toBeNull();
  });

  it('fires onFire after the armed minutes and clears', () => {
    const onFire = vi.fn();
    const { result } = renderHook(() => useSleepTimer(onFire, trackRef()));
    act(() => result.current.armSleep(15));
    expect(result.current.sleepMode).toBe(15);
    act(() => vi.advanceTimersByTime(15 * 60 * 1000));
    expect(onFire).toHaveBeenCalledOnce();
    expect(result.current.sleepMode).toBeNull();
  });

  it('cancels when armed with null', () => {
    const onFire = vi.fn();
    const { result } = renderHook(() => useSleepTimer(onFire, trackRef()));
    act(() => result.current.armSleep(30));
    act(() => result.current.armSleep(null));
    expect(result.current.sleepMode).toBeNull();
    act(() => vi.advanceTimersByTime(60 * 60 * 1000));
    expect(onFire).not.toHaveBeenCalled();
  });

  it('re-arming resets the countdown', () => {
    const onFire = vi.fn();
    const { result } = renderHook(() => useSleepTimer(onFire, trackRef()));
    act(() => result.current.armSleep(15));
    act(() => vi.advanceTimersByTime(10 * 60 * 1000));
    act(() => result.current.armSleep(15)); // reset
    act(() => vi.advanceTimersByTime(10 * 60 * 1000));
    expect(onFire).not.toHaveBeenCalled(); // only 10min into the reset
    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    expect(onFire).toHaveBeenCalledOnce();
  });

  it("'track' mode flips the ref on and starts no timeout", () => {
    const onFire = vi.fn();
    const ref = trackRef();
    const { result } = renderHook(() => useSleepTimer(onFire, ref));
    act(() => result.current.armSleep('track'));
    expect(result.current.sleepMode).toBe('track');
    expect(ref.current).toBe(true);
    act(() => vi.advanceTimersByTime(60 * 60 * 1000));
    expect(onFire).not.toHaveBeenCalled(); // no timer — the ended-handler drives it
  });

  it('arming a duration (or null) clears the track-end ref', () => {
    const ref = trackRef();
    const { result } = renderHook(() => useSleepTimer(vi.fn(), ref));
    act(() => result.current.armSleep('track'));
    expect(ref.current).toBe(true);
    act(() => result.current.armSleep(30));
    expect(ref.current).toBe(false);
  });
});
