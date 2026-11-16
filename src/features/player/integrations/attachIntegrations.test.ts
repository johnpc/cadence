import { describe, expect, it, vi } from 'vitest';
vi.mock('../../../lib/jellyfinPlayback', () => ({
  reportPlaybackStart: vi.fn(() => Promise.resolve()),
  reportPlaybackProgress: vi.fn(() => Promise.resolve()),
  reportPlaybackStopped: vi.fn(() => Promise.resolve()),
  savePlaybackPosition: vi.fn(() => Promise.resolve()),
  beaconPlaybackPosition: vi.fn(() => true),
}));
vi.mock('../../../lib/jellyfinItems', () => ({ getInstantMix: vi.fn(() => Promise.resolve([])) }));
import { reportPlaybackStart, reportPlaybackStopped } from '../../../lib/jellyfinPlayback';
import { attachIntegrations } from './attachIntegrations';
import { flush, startedEngine, track } from '../../../test/engineHarness';

describe('attachIntegrations', () => {
  it('wires every subscriber and detaches them all', async () => {
    const { engine } = startedEngine();
    const onReported = vi.fn();
    const off = attachIntegrations(engine, { onReported });
    engine.playQueue([track('a', { Artists: ['Ada'] })], 0);
    expect(document.title).toBe('Song a · Ada');
    expect(reportPlaybackStart).toHaveBeenCalledWith('a');
    await flush();
    expect(onReported).toHaveBeenCalled();
    off();
    expect(reportPlaybackStopped).toHaveBeenCalledWith('a', 0);
    expect(document.title).toBe('Cadence');
  });
});
