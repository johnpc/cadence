import { afterEach, describe, expect, it } from 'vitest';
import {
  CAST_OFF,
  getCastState,
  setCastState,
  onCastStateChange,
  isCastConnected,
  isCastPlaying,
} from './castStore';

describe('castStore', () => {
  afterEach(() => setCastState(CAST_OFF));

  it('starts off', () => {
    expect(getCastState()).toEqual({ status: 'off' });
    expect(isCastConnected()).toBe(false);
    expect(isCastPlaying()).toBe(false);
  });

  it('round-trips state and notifies subscribers', () => {
    const seen: string[] = [];
    const off = onCastStateChange(() => seen.push(getCastState().status));
    setCastState({ status: 'connected', deviceName: 'Living Room', playing: true });
    expect(isCastConnected()).toBe(true);
    expect(isCastPlaying()).toBe(true);
    off();
    setCastState(CAST_OFF);
    expect(seen).toEqual(['connected']); // no notify after unsubscribe
  });

  it('only a connected, playing receiver counts as playing', () => {
    expect(isCastPlaying({ status: 'connected', deviceName: 'TV', playing: false })).toBe(false);
    expect(isCastConnected({ status: 'connecting' })).toBe(false);
    expect(isCastConnected({ status: 'lost', deviceName: 'TV' })).toBe(false);
  });
});
