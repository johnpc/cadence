import { describe, expect, it, vi } from 'vitest';
import { attachEndlessPlay, type EndlessPlayDeps } from './endlessPlay';
import { flush, startedEngine, track } from '../../../test/engineHarness';
import type { JellyfinItem } from '../../../lib/jellyfinTypes';

function deps(mix: JellyfinItem[] = [track('a'), track('m1'), track('m2')], autoplay = true) {
  let listener: (on: boolean) => void = () => undefined;
  const d = {
    mix: vi.fn((): Promise<JellyfinItem[]> => Promise.resolve(mix)),
    autoplay: vi.fn(() => autoplay),
    onAutoplayChange: vi.fn((l: (on: boolean) => void) => {
      listener = l;
      return () => undefined;
    }),
  } satisfies EndlessPlayDeps;
  return { d, toggle: (on: boolean) => listener(on) };
}

describe('attachEndlessPlay', () => {
  it('appends radio at the last track, dropping the echoed seed', async () => {
    const { engine } = startedEngine();
    const { d } = deps();
    attachEndlessPlay(engine, d);
    engine.playQueue([track('a')], 0);
    await flush();
    expect(d.mix).toHaveBeenCalledWith('a');
    expect(engine.state.get().queue.tracks.map((t) => t.Id)).toEqual(['a', 'm1', 'm2']);
  });

  it('does nothing before the end, under repeat, or with Autoplay off', async () => {
    const { engine } = startedEngine();
    const { d } = deps();
    attachEndlessPlay(engine, d);
    engine.playQueue([track('a'), track('b')], 0);
    engine.cycleRepeat();
    engine.next();
    const off = deps(undefined, false);
    const { engine: e2 } = startedEngine();
    attachEndlessPlay(e2, off.d);
    e2.playQueue([track('z')], 0);
    await flush();
    expect(d.mix).not.toHaveBeenCalled();
    expect(off.d.mix).not.toHaveBeenCalled();
  });

  it('seeds once per tail track and drops a mix the queue moved past', async () => {
    const { engine } = startedEngine();
    let resolve: (m: JellyfinItem[]) => void = () => undefined;
    const { d } = deps();
    d.mix.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    attachEndlessPlay(engine, d);
    engine.playQueue([track('a')], 0);
    engine.setVolume(0.5); // an unrelated state change must not re-seed
    expect(d.mix).toHaveBeenCalledTimes(1);
    engine.playQueue([track('x'), track('y')], 0); // a new album starts
    resolve([track('m1')]);
    await flush();
    expect(engine.state.get().queue.tracks.map((t) => t.Id)).toEqual(['x', 'y']);
  });

  it('re-checks when Autoplay is switched on, and survives a failed mix', async () => {
    const { engine } = startedEngine();
    let on = false;
    const { d, toggle } = deps();
    d.autoplay.mockImplementation(() => on);
    d.mix.mockRejectedValueOnce(new Error('offline'));
    const off = attachEndlessPlay(engine, d);
    engine.playQueue([track('a')], 0);
    on = true;
    toggle(true);
    await flush();
    expect(d.mix).toHaveBeenCalledTimes(1);
    expect(engine.state.get().queue.tracks).toHaveLength(1);
    off();
  });
});
