import { afterEach, describe, expect, it, vi } from 'vitest';
import { notifyNativePlaybackStarted } from './nativeAudioSession';

interface WkWindow {
  webkit?: { messageHandlers?: { cadenceAudioSession?: { postMessage: (m: unknown) => void } } };
}

// Each test uses a `now` far past the previous so the module-level throttle
// (1s window) never bleeds between tests — except the throttle test itself.
let clock = 1_000_000;
function nextWindow(): number {
  clock += 10_000;
  return clock;
}

afterEach(() => {
  delete (window as unknown as WkWindow).webkit;
});

describe('notifyNativePlaybackStarted', () => {
  it('posts to the native handler when present (iOS)', () => {
    const postMessage = vi.fn();
    (window as unknown as WkWindow).webkit = {
      messageHandlers: { cadenceAudioSession: { postMessage } },
    };
    notifyNativePlaybackStarted(nextWindow());
    expect(postMessage).toHaveBeenCalledWith('play');
  });

  it('is a no-op when the handler is absent (web/Android)', () => {
    expect(() => notifyNativePlaybackStarted(nextWindow())).not.toThrow();
  });

  it('swallows a throwing handler (never breaks playback)', () => {
    (window as unknown as WkWindow).webkit = {
      messageHandlers: {
        cadenceAudioSession: {
          postMessage: () => {
            throw new Error('bridge gone');
          },
        },
      },
    };
    expect(() => notifyNativePlaybackStarted(nextWindow())).not.toThrow();
  });

  it('throttles bursts to one post per window, then posts again after it', () => {
    const postMessage = vi.fn();
    (window as unknown as WkWindow).webkit = {
      messageHandlers: { cadenceAudioSession: { postMessage } },
    };
    const t = nextWindow();
    notifyNativePlaybackStarted(t);
    notifyNativePlaybackStarted(t + 100); // within the 1s window → throttled
    notifyNativePlaybackStarted(t + 500); // still within → throttled
    expect(postMessage).toHaveBeenCalledTimes(1);
    notifyNativePlaybackStarted(t + 1500); // past the window → posts again
    expect(postMessage).toHaveBeenCalledTimes(2);
  });

  it('does not advance the throttle clock when no handler is present', () => {
    // A web call (no handler) must not "use up" the window — the next real iOS
    // call should still post.
    notifyNativePlaybackStarted(nextWindow());
    const postMessage = vi.fn();
    (window as unknown as WkWindow).webkit = {
      messageHandlers: { cadenceAudioSession: { postMessage } },
    };
    notifyNativePlaybackStarted(clock + 1); // 1ms later, but prior call had no handler
    expect(postMessage).toHaveBeenCalledTimes(1);
  });
});
