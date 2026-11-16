// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { playerContextValue } from './playerContextValue';
import { startedEngine, track } from '../../test/engineHarness';

describe('playerContextValue', () => {
  it('maps engine state to the public context, commands included', () => {
    const { engine } = startedEngine();
    const empty = playerContextValue(engine.state.get(), engine);
    expect(empty).toMatchObject({
      current: null,
      isPlaying: false,
      canPrev: false,
      canNext: false,
    });
    engine.playQueue([track('a'), track('b')], 1);
    engine.armSleep('track');
    const v = playerContextValue(engine.state.get(), engine);
    expect(v).toMatchObject({
      isPlaying: true,
      waiting: false,
      canPrev: true,
      canNext: false,
      queueIndex: 1,
      sleepMode: 'track',
      volume: 1,
      rate: 1,
    });
    expect(v.current?.Id).toBe('b');
    expect(v.stop).toBe(engine.stop);
  });
});
