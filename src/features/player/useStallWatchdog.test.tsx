import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStallWatchdog } from './useStallWatchdog';
import { setPlayIntent } from './playIntentStore';

/** A ref-like box around a fake audio element (only `paused` is read). */
const audioRef = (paused: boolean) => ({ current: { paused } as HTMLAudioElement });

describe('useStallWatchdog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setPlayIntent(true);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onStall after the timeout while an unpaused stall persists', () => {
    const onStall = vi.fn();
    renderHook(() => useStallWatchdog(audioRef(false), true, 0, onStall, 1000));
    vi.advanceTimersByTime(999);
    expect(onStall).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onStall).toHaveBeenCalledTimes(1);
  });

  it('does not fire when not waiting', () => {
    const onStall = vi.fn();
    renderHook(() => useStallWatchdog(audioRef(false), false, 0, onStall, 1000));
    vi.advanceTimersByTime(5000);
    expect(onStall).not.toHaveBeenCalled();
  });

  it('re-arms when position progresses (only a frozen stream times out)', () => {
    const onStall = vi.fn();
    const ref = audioRef(false);
    const { rerender } = renderHook(({ pos }) => useStallWatchdog(ref, true, pos, onStall, 1000), {
      initialProps: { pos: 0 },
    });
    vi.advanceTimersByTime(900);
    rerender({ pos: 1 }); // progress → timer restarts
    vi.advanceTimersByTime(900);
    expect(onStall).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onStall).toHaveBeenCalledTimes(1);
  });

  it('does NOT reset the countdown when the callback identity changes (re-render)', () => {
    const onStall = vi.fn();
    const ref = audioRef(false);
    const { rerender } = renderHook(
      // A fresh arrow each render — like the real call site.
      ({ n }) => useStallWatchdog(ref, true, 0, () => onStall(n), 1000),
      { initialProps: { n: 1 } },
    );
    vi.advanceTimersByTime(900);
    rerender({ n: 2 }); // re-render mid-stall must not re-arm
    vi.advanceTimersByTime(100);
    expect(onStall).toHaveBeenCalledTimes(1);
    expect(onStall).toHaveBeenCalledWith(2); // and the LATEST callback runs
  });

  it('clears the timer when waiting resolves', () => {
    const onStall = vi.fn();
    const ref = audioRef(false);
    const { rerender } = renderHook(({ w }) => useStallWatchdog(ref, w, 0, onStall, 1000), {
      initialProps: { w: true },
    });
    vi.advanceTimersByTime(900);
    rerender({ w: false });
    vi.advanceTimersByTime(5000);
    expect(onStall).not.toHaveBeenCalled();
  });

  it('never fires while the element is paused (interruption / cast handoff)', () => {
    const onStall = vi.fn();
    renderHook(() => useStallWatchdog(audioRef(true), true, 0, onStall, 1000));
    vi.advanceTimersByTime(1000);
    expect(onStall).not.toHaveBeenCalled();
  });

  it('never fires after a deliberate pause (play intent cleared)', () => {
    const onStall = vi.fn();
    renderHook(() => useStallWatchdog(audioRef(false), true, 0, onStall, 1000));
    setPlayIntent(false);
    vi.advanceTimersByTime(1000);
    expect(onStall).not.toHaveBeenCalled();
  });
});
