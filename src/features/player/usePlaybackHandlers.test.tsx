import { renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { usePlaybackHandlers } from './usePlaybackHandlers';
import type { usePlayerQueue } from './usePlayerQueue';

type QueueHook = ReturnType<typeof usePlayerQueue>;

function stubQueue(over: Partial<QueueHook> = {}): QueueHook {
  // A 2-track queue positioned at the first track (so there IS a next) by
  // default; the end-of-queue test overrides `queue`.
  return {
    advance: vi.fn(),
    next: vi.fn(),
    repeat: 'off',
    queue: { tracks: [{ Id: 'a' }, { Id: 'b' }], index: 0 },
    ...over,
  } as unknown as QueueHook;
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

  it('onEnded toasts at the end of the queue (repeat off, no next)', () => {
    const qh = stubQueue({ queue: { tracks: [{ Id: 'a' }], index: 0 } as never });
    const toast = vi.fn();
    const { result } = renderHook(() =>
      usePlaybackHandlers(qh, createRef<HTMLAudioElement>(), toast),
    );
    result.current.onEnded();
    expect(toast).toHaveBeenCalledWith("You've reached the end of the queue.");
  });

  it('onEnded does NOT toast when there is a next track', () => {
    const qh = stubQueue(); // index 0 of 2 → has next
    const toast = vi.fn();
    const { result } = renderHook(() =>
      usePlaybackHandlers(qh, createRef<HTMLAudioElement>(), toast),
    );
    result.current.onEnded();
    expect(toast).not.toHaveBeenCalled();
  });

  it('onEnded does NOT toast at the end when repeat is on (queue loops)', () => {
    const qh = stubQueue({ repeat: 'all', queue: { tracks: [{ Id: 'a' }], index: 0 } as never });
    const toast = vi.fn();
    const { result } = renderHook(() =>
      usePlaybackHandlers(qh, createRef<HTMLAudioElement>(), toast),
    );
    result.current.onEnded();
    expect(toast).not.toHaveBeenCalled();
  });

  it('onEnded honours an armed "end of track" sleep timer: pause + disarm, no advance', () => {
    const qh = stubQueue();
    const reached = vi.fn();
    const sleep = { active: { current: true }, onReached: { current: reached } };
    const { result } = renderHook(() =>
      usePlaybackHandlers(qh, createRef<HTMLAudioElement>(), vi.fn(), sleep),
    );
    result.current.onEnded();
    expect(reached).toHaveBeenCalledOnce();
    expect(qh.advance).not.toHaveBeenCalled();
  });

  it('onEnded advances normally when the sleep timer is NOT armed', () => {
    const qh = stubQueue();
    const sleep = { active: { current: false }, onReached: { current: vi.fn() } };
    const { result } = renderHook(() =>
      usePlaybackHandlers(qh, createRef<HTMLAudioElement>(), vi.fn(), sleep),
    );
    result.current.onEnded();
    expect(qh.advance).toHaveBeenCalled();
  });

  it('onError RETRIES (reload) the track first, before skipping', () => {
    const qh = stubQueue();
    const toast = vi.fn();
    const requestReload = vi.fn().mockReturnValue(true); // retry available
    const ref = createRef<HTMLAudioElement>();
    (ref as { current: HTMLAudioElement }).current = { paused: false } as HTMLAudioElement;
    const { result } = renderHook(() =>
      usePlaybackHandlers(qh, ref, toast, undefined, requestReload),
    );
    result.current.onError();
    expect(requestReload).toHaveBeenCalledWith('a'); // the current track id
    expect(toast).toHaveBeenCalledWith('Trouble playing that — retrying…');
    expect(qh.next).not.toHaveBeenCalled();
  });

  it('onError skips once the retry budget is spent (requestReload → false)', () => {
    const qh = stubQueue();
    const toast = vi.fn();
    const requestReload = vi.fn().mockReturnValue(false); // no retries left
    const ref = createRef<HTMLAudioElement>();
    (ref as { current: HTMLAudioElement }).current = { paused: false } as HTMLAudioElement;
    const { result } = renderHook(() =>
      usePlaybackHandlers(qh, ref, toast, undefined, requestReload),
    );
    result.current.onError();
    expect(toast).toHaveBeenCalledWith("Couldn't play that track — skipping.");
    expect(qh.next).toHaveBeenCalled();
  });

  it('onError at the LAST track reports failure without a dead-end "skipping" toast', () => {
    const qh = stubQueue({ queue: { tracks: [{ Id: 'a' }], index: 0 } as never });
    const toast = vi.fn();
    const requestReload = vi.fn().mockReturnValue(false);
    const ref = createRef<HTMLAudioElement>();
    (ref as { current: HTMLAudioElement }).current = { paused: false } as HTMLAudioElement;
    const { result } = renderHook(() =>
      usePlaybackHandlers(qh, ref, toast, undefined, requestReload),
    );
    result.current.onError();
    expect(toast).toHaveBeenCalledWith("Couldn't play that track.");
    expect(qh.next).not.toHaveBeenCalled();
  });
});
