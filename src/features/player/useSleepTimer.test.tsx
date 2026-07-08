import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSleepTimer } from './useSleepTimer';

describe('useSleepTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts unset', () => {
    const { result } = renderHook(() => useSleepTimer(vi.fn()));
    expect(result.current.sleepMinutes).toBeNull();
  });

  it('fires onFire after the armed minutes and clears', () => {
    const onFire = vi.fn();
    const { result } = renderHook(() => useSleepTimer(onFire));
    act(() => result.current.armSleep(15));
    expect(result.current.sleepMinutes).toBe(15);
    act(() => vi.advanceTimersByTime(15 * 60 * 1000));
    expect(onFire).toHaveBeenCalledOnce();
    expect(result.current.sleepMinutes).toBeNull();
  });

  it('cancels when armed with null', () => {
    const onFire = vi.fn();
    const { result } = renderHook(() => useSleepTimer(onFire));
    act(() => result.current.armSleep(30));
    act(() => result.current.armSleep(null));
    expect(result.current.sleepMinutes).toBeNull();
    act(() => vi.advanceTimersByTime(60 * 60 * 1000));
    expect(onFire).not.toHaveBeenCalled();
  });

  it('re-arming resets the countdown', () => {
    const onFire = vi.fn();
    const { result } = renderHook(() => useSleepTimer(onFire));
    act(() => result.current.armSleep(15));
    act(() => vi.advanceTimersByTime(10 * 60 * 1000));
    act(() => result.current.armSleep(15)); // reset
    act(() => vi.advanceTimersByTime(10 * 60 * 1000));
    expect(onFire).not.toHaveBeenCalled(); // only 10min into the reset
    act(() => vi.advanceTimersByTime(5 * 60 * 1000));
    expect(onFire).toHaveBeenCalledOnce();
  });
});
