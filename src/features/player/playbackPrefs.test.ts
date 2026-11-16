import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clampRate,
  clampVolume,
  loadRate,
  loadVolume,
  saveRate,
  saveVolume,
} from './playbackPrefs';

describe('playbackPrefs', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('clampRate snaps to 0.25 steps within [0.5, 3] and rejects junk', () => {
    expect(clampRate(1.3)).toBe(1.25);
    expect(clampRate(1.4)).toBe(1.5);
    expect(clampRate(9)).toBe(3);
    expect(clampRate(0.1)).toBe(0.5);
    expect(clampRate(Number.NaN)).toBe(1);
    expect(clampRate(-2)).toBe(1);
  });

  it('clampVolume bounds to [0, 1]', () => {
    expect(clampVolume(2)).toBe(1);
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(Number.NaN)).toBe(1);
  });

  it('volume defaults to 1, round-trips, and ignores junk', () => {
    expect(loadVolume()).toBe(1);
    saveVolume(0.4);
    expect(loadVolume()).toBe(0.4);
    localStorage.setItem('cadence.volume', '7');
    expect(loadVolume()).toBe(1);
  });

  it('rate defaults to 1, round-trips snapped, and ignores junk', () => {
    expect(loadRate()).toBe(1);
    saveRate(1.5);
    expect(loadRate()).toBe(1.5);
    localStorage.setItem('cadence.playbackRate', 'fast');
    expect(loadRate()).toBe(1);
  });

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('full');
    });
    expect(loadVolume()).toBe(1);
    expect(loadRate()).toBe(1);
    expect(() => saveVolume(0.5)).not.toThrow();
  });
});
