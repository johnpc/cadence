import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSmartPrev } from './useSmartPrev';

function setup(currentTime: number) {
  const seek = vi.fn();
  const queuePrev = vi.fn();
  const ref = { current: { currentTime } as HTMLAudioElement };
  const { result } = renderHook(() => useSmartPrev(ref, seek, queuePrev));
  return { prev: result.current, seek, queuePrev };
}

describe('useSmartPrev', () => {
  it('restarts the current track when deep into it', () => {
    const { prev, seek, queuePrev } = setup(30);
    prev();
    expect(seek).toHaveBeenCalledWith(0);
    expect(queuePrev).not.toHaveBeenCalled();
  });

  it('goes to the previous track near the start', () => {
    const { prev, seek, queuePrev } = setup(1);
    prev();
    expect(queuePrev).toHaveBeenCalledOnce();
    expect(seek).not.toHaveBeenCalled();
  });

  it('treats a null element as position 0 (previous track)', () => {
    const seek = vi.fn();
    const queuePrev = vi.fn();
    const ref = { current: null };
    const { result } = renderHook(() => useSmartPrev(ref, seek, queuePrev));
    result.current();
    expect(queuePrev).toHaveBeenCalledOnce();
  });
});
