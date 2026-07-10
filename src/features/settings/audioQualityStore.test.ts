import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  readAudioQuality,
  writeAudioQuality,
  onAudioQualityChange,
  currentBitrateCap,
} from './audioQualityStore';

describe('audioQualityStore', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('defaults to auto (no bitrate cap)', () => {
    expect(readAudioQuality()).toBe('auto');
    expect(currentBitrateCap()).toBeNull();
  });

  it('round-trips a tier and maps it to a bitrate cap', () => {
    writeAudioQuality('normal');
    expect(readAudioQuality()).toBe('normal');
    expect(currentBitrateCap()).toBe(192_000);
    writeAudioQuality('low');
    expect(currentBitrateCap()).toBe(96_000);
  });

  it('treats a garbage stored value as auto', () => {
    localStorage.setItem('cadence.audio-quality', 'ultra');
    expect(readAudioQuality()).toBe('auto');
  });

  it('notifies subscribers and stops after unsubscribe', () => {
    const seen: string[] = [];
    const off = onAudioQualityChange((q) => seen.push(q));
    writeAudioQuality('high');
    off();
    writeAudioQuality('low');
    expect(seen).toEqual(['high']);
  });
});
