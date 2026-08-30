import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useStallWatchdog } from './useStallWatchdog';
import { setPlayIntent } from './playIntentStore';

describe('useStallWatchdog', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setPlayIntent(true);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires onStall after the timeout while waiting persists', () => {
    const onStall = vi.fn();
    renderHook(() => useStallWatchdog(true, 0, onStall, 1000));
    vi.advanceTimersByTime(999);
    expect(onStall).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(onStall).toHaveBeenCalledTimes(1);
  });

  it('does not fire when not waiting', () => {
    const onStall = vi.fn();
    renderHook(() => useStallWatchdog(false, 0, onStall, 1000));
    vi.advanceTimersByTime(5000);
    expect(onStall).not.toHaveBeenCalled();
  });

  it('re-arms when position progresses (only a frozen stream times out)', () => {
    const onStall = vi.fn();
    const { rerender } = renderHook(({ pos }) => useStallWatchdog(true, pos, onStall, 1000), {
      initialProps: { pos: 0 },
    });
    vi.advanceTimersByTime(900);
    rerender({ pos: 1 }); // progress → timer restarts
    vi.advanceTimersByTime(900);
    expect(onStall).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(onStall).toHaveBeenCalledTimes(1);
  });

  it('clears the timer when waiting resolves', () => {
    const onStall = vi.fn();
    const { rerender } = renderHook(({ w }) => useStallWatchdog(w, 0, onStall, 1000), {
      initialProps: { w: true },
    });
    vi.advanceTimersByTime(900);
    rerender({ w: false });
    vi.advanceTimersByTime(5000);
    expect(onStall).not.toHaveBeenCalled();
  });

  it('never fires after a deliberate pause (play intent cleared)', () => {
    const onStall = vi.fn();
    renderHook(() => useStallWatchdog(true, 0, onStall, 1000));
    setPlayIntent(false);
    vi.advanceTimersByTime(1000);
    expect(onStall).not.toHaveBeenCalled();
  });
});
