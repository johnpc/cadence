import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useScrubber } from './useScrubber';

describe('useScrubber', () => {
  it('shows the live position when not dragging', () => {
    const { result, rerender } = renderHook(({ pos }) => useScrubber(pos, vi.fn()), {
      initialProps: { pos: 10 },
    });
    expect(result.current.value).toBe(10);
    rerender({ pos: 20 });
    expect(result.current.value).toBe(20);
  });

  it('shows the drag value while dragging, ignoring live position updates', () => {
    const { result, rerender } = renderHook(({ pos }) => useScrubber(pos, vi.fn()), {
      initialProps: { pos: 10 },
    });
    act(() => result.current.onInput(55));
    expect(result.current.value).toBe(55);
    // Playback keeps advancing, but the slider stays on the drag target.
    rerender({ pos: 12 });
    expect(result.current.value).toBe(55);
  });

  it('seeks once on commit, then follows live position again', () => {
    const seek = vi.fn();
    const { result, rerender } = renderHook(({ pos }) => useScrubber(pos, seek), {
      initialProps: { pos: 10 },
    });
    act(() => result.current.onInput(40));
    act(() => result.current.onInput(80)); // multiple drag steps
    expect(seek).not.toHaveBeenCalled(); // no seek mid-drag
    act(() => result.current.onCommit());
    expect(seek).toHaveBeenCalledTimes(1);
    expect(seek).toHaveBeenCalledWith(80);
    rerender({ pos: 81 });
    expect(result.current.value).toBe(81); // back to live
  });

  it('commit without a drag does not seek', () => {
    const seek = vi.fn();
    const { result } = renderHook(() => useScrubber(10, seek));
    act(() => result.current.onCommit());
    expect(seek).not.toHaveBeenCalled();
  });
});
