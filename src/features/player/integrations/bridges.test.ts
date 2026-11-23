import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachNativeNowPlaying } from './nativeNowPlaying';
import { attachWatchRemote } from './watchRemote';
import { nowPlayingSnapshot } from './nowPlayingSnapshot';
import { NOW_PLAYING_EVENT, NOW_PLAYING_SEEK_EVENT } from '../../nowplaying/nowPlayingTypes';
import { WATCH_COMMAND_EVENT } from '../../watch/watchTypes';
import { startedEngine, track } from '../../../test/engineHarness';

type Webkit = { messageHandlers: Record<string, { postMessage: ReturnType<typeof vi.fn> }> };
function installBridges(): Webkit['messageHandlers'] {
  const handlers = {
    cadenceNowPlaying: { postMessage: vi.fn() },
    cadenceWatch: { postMessage: vi.fn() },
  };
  (window as unknown as { webkit?: Webkit }).webkit = { messageHandlers: handlers };
  return handlers;
}
const pushed = (fn: ReturnType<typeof vi.fn>) =>
  fn.mock.calls.map((c) => JSON.parse(c[0] as string) as Record<string, unknown>);

afterEach(() => {
  delete (window as unknown as { webkit?: Webkit }).webkit;
});

describe('nowPlayingSnapshot', () => {
  it('derives one view for every surface (whole seconds, queue position)', () => {
    const { engine } = startedEngine();
    engine.playQueue([track('a'), track('b')], 1);
    expect(
      nowPlayingSnapshot(engine.state.get(), { position: 12.6, duration: 99.4, phase: 'known' }),
    ).toEqual({
      track: expect.objectContaining({ Id: 'b' }),
      isPlaying: true,
      position: 13,
      duration: 99,
      queueIndex: 1,
      queueCount: 2,
      rate: 1,
    });
  });
});

describe('attachNativeNowPlaying', () => {
  it('pushes deduped state to the bridge and maps native commands', () => {
    const bridges = installBridges();
    const { engine, audio } = startedEngine();
    const off = attachNativeNowPlaying(engine);
    engine.playQueue([track('a', { Artists: ['Ada'], Album: 'LP' }), track('b')], 0);
    audio.tick(1.2);
    audio.tick(1.4); // same whole second → no new push
    const states = pushed(bridges.cadenceNowPlaying.postMessage);
    expect(states.at(-1)).toMatchObject({
      title: 'Song a',
      artist: 'Ada',
      album: 'LP',
      isPlaying: true,
      position: 1,
      hasTrack: true,
      queueIndex: 0,
      queueCount: 2,
      rate: 1,
    });
    engine.setRate(1.5); // an audiobook sped up: native gets the real speed
    expect(pushed(bridges.cadenceNowPlaying.postMessage).at(-1)).toMatchObject({ rate: 1.5 });
    expect(states.filter((s) => s.position === 1)).toHaveLength(1);

    window.dispatchEvent(new Event(NOW_PLAYING_EVENT.pause));
    expect(engine.state.get().status).toBe('paused');
    window.dispatchEvent(new Event(NOW_PLAYING_EVENT.play));
    window.dispatchEvent(new Event(NOW_PLAYING_EVENT.next));
    expect(engine.state.get().queue.index).toBe(1);
    window.dispatchEvent(new Event(NOW_PLAYING_EVENT.prev));
    expect(engine.state.get().queue.index).toBe(0);
    window.dispatchEvent(new CustomEvent(NOW_PLAYING_SEEK_EVENT, { detail: 42 }));
    expect(audio.currentTime).toBe(42);
    window.dispatchEvent(new CustomEvent(NOW_PLAYING_SEEK_EVENT, { detail: 'junk' }));
    expect(audio.currentTime).toBe(42);
    off();
    window.dispatchEvent(new Event(NOW_PLAYING_EVENT.next));
    expect(engine.state.get().queue.index).toBe(0);
  });

  it('is inert without the native bridge (commands still bind harmlessly)', () => {
    const { engine } = startedEngine();
    const off = attachNativeNowPlaying(engine);
    engine.playQueue([track('a')], 0);
    off();
    expect((window as unknown as { webkit?: Webkit }).webkit).toBeUndefined();
  });
});

describe('attachWatchRemote', () => {
  it('pushes the watch state and maps watch commands', () => {
    const bridges = installBridges();
    const { engine, audio } = startedEngine();
    const off = attachWatchRemote(engine);
    engine.playQueue([track('a'), track('b')], 0);
    expect(pushed(bridges.cadenceWatch.postMessage).at(-1)).toMatchObject({
      title: 'Song a',
      isPlaying: true,
      hasTrack: true,
    });
    audio.duration = 300;
    audio.currentTime = 100;
    window.dispatchEvent(new Event(WATCH_COMMAND_EVENT.seekForward));
    expect(audio.currentTime).toBe(115);
    window.dispatchEvent(new Event(WATCH_COMMAND_EVENT.seekBack));
    expect(audio.currentTime).toBe(100);
    window.dispatchEvent(new Event(WATCH_COMMAND_EVENT.toggle));
    expect(engine.state.get().status).toBe('paused');
    window.dispatchEvent(new Event(WATCH_COMMAND_EVENT.next));
    window.dispatchEvent(new Event(WATCH_COMMAND_EVENT.prev));
    expect(engine.state.get().queue.index).toBe(0);
    off();
  });

  it('is inert without the watch bridge', () => {
    const { engine } = startedEngine();
    const off = attachWatchRemote(engine);
    engine.playQueue([track('a')], 0);
    off();
  });
});
