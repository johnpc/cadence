import { afterEach, describe, expect, it, vi } from 'vitest';
import { notifyNativePlaybackStarted } from './nativeAudioSession';

interface WkWindow {
  webkit?: { messageHandlers?: { cadenceAudioSession?: { postMessage: (m: unknown) => void } } };
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
    notifyNativePlaybackStarted();
    expect(postMessage).toHaveBeenCalledWith('play');
  });

  it('is a no-op when the handler is absent (web/Android)', () => {
    expect(() => notifyNativePlaybackStarted()).not.toThrow();
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
    expect(() => notifyNativePlaybackStarted()).not.toThrow();
  });
});
