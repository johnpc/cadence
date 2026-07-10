import { afterEach, describe, expect, it } from 'vitest';
import { getCastState, setCastState, onCastStateChange } from './castStore';

describe('castStore', () => {
  afterEach(() => setCastState({ connected: false, deviceName: '', playing: false }));

  it('starts disconnected', () => {
    expect(getCastState()).toEqual({ connected: false, deviceName: '', playing: false });
  });

  it('round-trips state and notifies subscribers', () => {
    const seen: string[] = [];
    const off = onCastStateChange(() => seen.push(getCastState().deviceName));
    setCastState({ connected: true, deviceName: 'Living Room', playing: true });
    expect(getCastState()).toEqual({ connected: true, deviceName: 'Living Room', playing: true });
    off();
    setCastState({ connected: false, deviceName: '', playing: false });
    expect(seen).toEqual(['Living Room']); // no notify after unsubscribe
  });
});
