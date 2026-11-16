import { describe, expect, it, vi } from 'vitest';
import { attachNextTrackPrefetch } from './nextTrackPrefetch';
import { setSession } from '../../../lib/sessionStore';
import { startedEngine, track } from '../../../test/engineHarness';
import { FakeAudio } from '../../../test/fakeAudio';

describe('attachNextTrackPrefetch', () => {
  it('warms the next track only while playing, and releases it on detach', () => {
    setSession({ token: 't', userId: 'u' });
    const { engine } = startedEngine();
    const el = new FakeAudio();
    const create = vi.fn(() => el);
    const off = attachNextTrackPrefetch(engine, create);
    engine.playQueue([track('a'), track('b')], 0);
    expect(el.src).toContain('/Audio/b/universal');
    expect(el).toMatchObject({ preload: 'auto', muted: true });
    engine.pause();
    engine.next(); // last track, paused → nothing more to warm
    off();
    expect(el.src).toBe('');
    expect(create).toHaveBeenCalledTimes(1);
    setSession(null);
  });

  it('never creates an element when there is nothing to warm', () => {
    const { engine } = startedEngine();
    const create = vi.fn(() => new FakeAudio());
    const off = attachNextTrackPrefetch(engine, create);
    engine.playQueue([track('a')], 0);
    off();
    expect(create).not.toHaveBeenCalled();
  });
});
