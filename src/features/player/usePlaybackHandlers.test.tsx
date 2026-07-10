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

  it('onError toasts and skips when the error happens during playback', () => {
    const qh = stubQueue();
    const toast = vi.fn();
    const ref = createRef<HTMLAudioElement>();
    (ref as { current: HTMLAudioElement }).current = { paused: false } as HTMLAudioElement;
    const { result } = renderHook(() => usePlaybackHandlers(qh, ref, toast));
    result.current.onError();
    expect(toast).toHaveBeenCalledWith("Couldn't play that track — skipping.");
    expect(qh.next).toHaveBeenCalled();
  });

  it('onError is IGNORED when paused (spurious cold-launch error, not a real failure)', () => {
    const qh = stubQueue();
    const toast = vi.fn();
    const ref = createRef<HTMLAudioElement>();
    (ref as { current: HTMLAudioElement }).current = { paused: true } as HTMLAudioElement;
    const { result } = renderHook(() => usePlaybackHandlers(qh, ref, toast));
    result.current.onError();
    expect(toast).not.toHaveBeenCalled();
    expect(qh.next).not.toHaveBeenCalled();
  });
});
