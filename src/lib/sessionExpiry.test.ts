import { describe, expect, it, vi } from 'vitest';
import { onSessionExpired, notifySessionExpired } from './sessionExpiry';

describe('sessionExpiry', () => {
  it('notifies every subscriber', () => {
    const a = vi.fn();
    const b = vi.fn();
    onSessionExpired(a);
    onSessionExpired(b);
    notifySessionExpired();
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });

  it('stops notifying after unsubscribe', () => {
    const fn = vi.fn();
    const off = onSessionExpired(fn);
    off();
    notifySessionExpired();
    expect(fn).not.toHaveBeenCalled();
  });
});
