import { describe, expect, it, vi } from 'vitest';
vi.mock('../mediaSession', () => ({
  bindMediaSessionHandlers: vi.fn(),
  setNowPlaying: vi.fn(),
  setPlaybackState: vi.fn(),
  setPositionState: vi.fn(),
}));
import {
  bindMediaSessionHandlers,
  setNowPlaying,
  setPlaybackState,
  setPositionState,
} from '../mediaSession';
import { attachMediaSession } from './mediaSessionSync';
import { startedEngine, track } from '../../../test/engineHarness';

describe('attachMediaSession', () => {
  it('publishes track, state and position, re-binding handlers per track', () => {
    const { engine, audio } = startedEngine();
    const off = attachMediaSession(engine);
    expect(setNowPlaying).toHaveBeenLastCalledWith(null);
    expect(setPlaybackState).toHaveBeenLastCalledWith(false);
    engine.playQueue([track('a'), track('b')], 0);
    expect(setNowPlaying).toHaveBeenLastCalledWith(expect.objectContaining({ Id: 'a' }));
    expect(setPlaybackState).toHaveBeenLastCalledWith(true);
    audio.loadMetadata(180);
    audio.tick(20);
    expect(setPositionState).toHaveBeenLastCalledWith(20, 180, 1);
    engine.pause();
    engine.setRate(2); // paused (no ticks) — a speed change still reaches the OS
    expect(setPositionState).toHaveBeenLastCalledWith(20, 180, 2);
    engine.play();
    engine.next();
    expect(bindMediaSessionHandlers).toHaveBeenCalledTimes(3);
    const handlers = vi.mocked(bindMediaSessionHandlers).mock.calls[0][0];
    expect(handlers).toMatchObject({ play: engine.play, pause: engine.pause, seek: engine.seek });
    off();
    engine.pause();
    expect(setPlaybackState).toHaveBeenLastCalledWith(true);
  });
});
