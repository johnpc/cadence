import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../lib/diagnostics/diagnosticsStore', () => ({ log: vi.fn() }));

const castState = { connected: false };
vi.mock('../cast/castStore', () => ({ getCastState: () => castState }));
const castCtrl = { castToggle: vi.fn() };
vi.mock('../cast/castController', () => ({
  castToggle: (...a: unknown[]) => castCtrl.castToggle(...a),
}));

import { playAudio, pauseAudio } from './playbackActions';
import { getPlayIntent, setPlayIntent } from './playIntentStore';

function fakeAudio(paused: boolean) {
  return {
    paused,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
  } as unknown as HTMLAudioElement;
}

describe('playbackActions', () => {
  afterEach(() => {
    setPlayIntent(false);
    castState.connected = false;
    vi.clearAllMocks();
  });

  it('playAudio plays the element and records play intent', () => {
    const audio = fakeAudio(true);
    playAudio(audio);
    expect(audio.play).toHaveBeenCalled();
    expect(getPlayIntent()).toBe(true);
  });

  it('playAudio plays even when the element reports NOT paused (iOS interruption desync)', () => {
    const audio = fakeAudio(false);
    playAudio(audio);
    expect(audio.play).toHaveBeenCalled();
  });

  it('pauseAudio pauses the element and clears play intent (deliberate stop)', () => {
    setPlayIntent(true);
    const audio = fakeAudio(false);
    pauseAudio(audio);
    expect(audio.pause).toHaveBeenCalled();
    expect(getPlayIntent()).toBe(false);
  });

  it('playAudio proxies to the cast receiver while connected (no local play)', () => {
    castState.connected = true;
    castCtrl.castToggle.mockResolvedValue(undefined);
    const audio = fakeAudio(true);
    playAudio(audio);
    expect(castCtrl.castToggle).toHaveBeenCalled();
    expect(audio.play).not.toHaveBeenCalled();
    // Intent is still recorded so a later interruption knows to resume.
    expect(getPlayIntent()).toBe(true);
  });

  it('pauseAudio proxies to the cast receiver while connected (no local pause)', () => {
    castState.connected = true;
    castCtrl.castToggle.mockResolvedValue(undefined);
    const audio = fakeAudio(false);
    pauseAudio(audio);
    expect(castCtrl.castToggle).toHaveBeenCalled();
    expect(audio.pause).not.toHaveBeenCalled();
  });

  it('tolerates a null element (no queue / cast-only)', () => {
    expect(() => playAudio(null)).not.toThrow();
    expect(() => pauseAudio(null)).not.toThrow();
  });
});
