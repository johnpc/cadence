import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../cast/castController', () => ({
  castSeek: vi.fn(),
  castToggle: vi.fn(),
  castTrack: vi.fn(),
  stopCast: vi.fn(),
}));
import { browserEngineDeps, STALL_TIMEOUT_MS } from './browserEngineDeps';
import { setSession } from '../../../lib/sessionStore';
import { setCastState } from '../../cast/castStore';

afterEach(() => {
  setSession(null);
  localStorage.clear();
  document.querySelectorAll('audio').forEach((el) => el.remove());
});

describe('browserEngineDeps', () => {
  it('attaches one hidden element to the document, once', () => {
    const deps = browserEngineDeps(vi.fn());
    deps.attach();
    deps.attach();
    const els = document.querySelectorAll('audio');
    expect(els).toHaveLength(1);
    expect(els[0].hasAttribute('hidden')).toBe(true);
  });

  it('reads persisted preferences and the live session + cast state', () => {
    localStorage.setItem('cadence.volume', '0.3');
    localStorage.setItem('cadence.modes', JSON.stringify({ shuffle: true, repeat: 'all' }));
    const deps = browserEngineDeps(vi.fn());
    expect(deps.initial).toMatchObject({ volume: 0.3, shuffle: true, repeat: 'all' });
    expect(deps.session.userId()).toBe('');
    setSession({ token: 't', userId: 'u1' });
    expect(deps.session.userId()).toBe('u1');
    setCastState({ connected: true, deviceName: 'TV', playing: false });
    expect(deps.cast.connected()).toBe(true);
    expect(deps.cast.playing()).toBe(false);
    setCastState({ connected: false, deviceName: '', playing: false });
    expect(deps.stallTimeoutMs).toBe(STALL_TIMEOUT_MS);
    expect(() => {
      deps.haptic();
      deps.onAudible();
    }).not.toThrow();
  });

  it('routes notifications to the given toast', () => {
    const notify = vi.fn();
    browserEngineDeps(notify).notify('hi');
    expect(notify).toHaveBeenCalledWith('hi');
  });
});
