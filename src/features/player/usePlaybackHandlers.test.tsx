import { renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { usePlaybackHandlers } from './usePlaybackHandlers';
import type { usePlayerQueue } from './usePlayerQueue';

type QueueHook = ReturnType<typeof usePlayerQueue>;

function stubQueue(over: Partial<QueueHook> = {}): QueueHook {
  return { advance: vi.fn(), next: vi.fn(), ...over } as unknown as QueueHook;
}

describe('usePlaybackHandlers', () => {
  it('onEnded advances the queue', () => {
    const qh = stubQueue();
    const { result } = renderHook(() =>
      usePlaybackHandlers(qh, createRef<HTMLAudioElement>(), vi.fn()),
    );
    result.current.onEnded();
    expect(qh.advance).toHaveBeenCalled();
  });

  it('onError toasts and skips to the next track', () => {
    const qh = stubQueue();
    const toast = vi.fn();
    const { result } = renderHook(() =>
      usePlaybackHandlers(qh, createRef<HTMLAudioElement>(), toast),
    );
    result.current.onError();
    expect(toast).toHaveBeenCalledWith("Couldn't play that track — skipping.");
    expect(qh.next).toHaveBeenCalled();
  });
});
