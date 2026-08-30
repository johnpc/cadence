import { afterEach, describe, expect, it } from 'vitest';
import { adoptPlaybackAudioSession } from './webAudioSession';

interface AudioSessionWindow {
  audioSession?: { type: string };
}

const nav = navigator as Navigator & AudioSessionWindow;

afterEach(() => {
  delete nav.audioSession;
});

describe('adoptPlaybackAudioSession', () => {
  it('sets audioSession.type to playback when the API exists (iOS 17+)', () => {
    nav.audioSession = { type: 'auto' };
    expect(adoptPlaybackAudioSession()).toBe(true);
    expect(nav.audioSession.type).toBe('playback');
  });

  it('returns false when the API is absent (older iOS / other browsers)', () => {
    expect(adoptPlaybackAudioSession()).toBe(false);
  });

  it('returns false when assigning the type throws', () => {
    nav.audioSession = {} as { type: string };
    Object.defineProperty(nav.audioSession, 'type', {
      set() {
        throw new Error('unsupported');
      },
    });
    expect(adoptPlaybackAudioSession()).toBe(false);
  });
});
