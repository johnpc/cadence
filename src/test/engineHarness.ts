import { vi } from 'vitest';
import { createStore } from '../lib/store';
import { createPlayerEngine } from '../features/player/engine/createPlayerEngine';
import { EMPTY_QUEUE, type QueueState } from '../features/player/queue';
import type { EngineDeps, PlayerEngine } from '../features/player/engine/types';
import type { JellyfinItem } from '../lib/jellyfinTypes';
import { FakeAudio } from './fakeAudio';

export const track = (id: string, extra: Partial<JellyfinItem> = {}): JellyfinItem => ({
  Id: id,
  Name: `Song ${id}`,
  Type: 'Audio',
  ...extra,
});

/** A fake platform for the engine: a FakeAudio, a session + cast receiver as
 * plain stores, spies for every outbound effect, and a deterministic random. */
export function fakePlatform(
  options: {
    queue?: QueueState;
    userId?: string;
    shuffle?: boolean;
    repeat?: EngineDeps['initial']['repeat'];
    volume?: number;
    rate?: number;
  } = {},
) {
  const audio = new FakeAudio();
  const session = createStore(options.userId ?? 'user-1');
  const cast = createStore({ connected: false, playing: false });
  const deps = {
    audio,
    attach: vi.fn(),
    initial: {
      queue: options.queue ?? EMPTY_QUEUE,
      shuffle: options.shuffle ?? false,
      repeat: options.repeat ?? 'off',
      volume: options.volume ?? 1,
      rate: options.rate ?? 1,
    },
    persist: { queue: vi.fn(), modes: vi.fn(), volume: vi.fn(), rate: vi.fn() },
    resolveSrc: vi.fn(
      (id: string): string | Promise<string> => `https://jf.test/Audio/${id}/universal`,
    ),
    session: { userId: () => session.get(), subscribe: session.subscribe },
    cast: {
      connected: () => cast.get().connected,
      playing: () => cast.get().playing,
      subscribe: cast.subscribe,
      load: vi.fn(() => Promise.resolve()),
      toggle: vi.fn(() => {
        cast.set({ ...cast.get(), playing: !cast.get().playing });
        return Promise.resolve();
      }),
      seek: vi.fn(() => Promise.resolve()),
      stop: vi.fn(() => {
        cast.set({ connected: false, playing: false });
        return Promise.resolve();
      }),
    },
    resumeAt: vi.fn((): Promise<number | null> => Promise.resolve(null)),
    notify: vi.fn(),
    haptic: vi.fn(),
    onAudible: vi.fn(),
    random: () => 0,
    log: vi.fn(),
    stallTimeoutMs: 45_000,
  } satisfies EngineDeps;
  return { audio, session, cast, deps };
}

/** An engine on a fake platform, already started. */
export function startedEngine(options: Parameters<typeof fakePlatform>[0] = {}) {
  const platform = fakePlatform(options);
  const engine: PlayerEngine = createPlayerEngine(platform.deps);
  const stop = engine.start();
  return { ...platform, engine, stop, status: () => engine.state.get().status };
}

/** Let pending promise callbacks (async src resolution, report chains) run —
 * microtasks only, so it works under fake timers too. */
export async function flush(): Promise<void> {
  for (let i = 0; i < 6; i++) await Promise.resolve();
}
