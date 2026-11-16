import { describe, expect, it } from 'vitest';
import { attachAudioRouteLost, AUDIO_ROUTE_LOST } from './audioRouteLost';
import { startedEngine, track } from '../../../test/engineHarness';

describe('attachAudioRouteLost', () => {
  it('pauses (and drops intent) when headphones or Bluetooth disconnect', () => {
    const { engine, audio } = startedEngine();
    const off = attachAudioRouteLost(engine);
    engine.playQueue([track('a')], 0);
    window.dispatchEvent(new Event(AUDIO_ROUTE_LOST));
    expect(audio.paused).toBe(true);
    expect(engine.state.get()).toMatchObject({ status: 'paused', intent: false });
    off();
    engine.play();
    window.dispatchEvent(new Event(AUDIO_ROUTE_LOST));
    expect(audio.paused).toBe(false);
  });
});
