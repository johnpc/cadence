import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  setProgress,
  clearProgress,
  getProgress,
  onProgressChange,
  __resetProgress,
} from './downloadProgress';

afterEach(() => __resetProgress());

describe('downloadProgress', () => {
  it('stores and reads a fraction', () => {
    setProgress('a', 0.5);
    expect(getProgress('a')).toBe(0.5);
  });

  it('clamps fractions to 0..1', () => {
    setProgress('a', 1.5);
    expect(getProgress('a')).toBe(1);
    setProgress('a', -0.2);
    expect(getProgress('a')).toBe(0);
  });

  it('returns undefined for an unknown track', () => {
    expect(getProgress('nope')).toBeUndefined();
  });

  it('clears an entry', () => {
    setProgress('a', 0.3);
    clearProgress('a');
    expect(getProgress('a')).toBeUndefined();
  });

  it('notifies subscribers on set and clear', () => {
    const spy = vi.fn();
    const off = onProgressChange(spy);
    setProgress('a', 0.1);
    setProgress('a', 0.2);
    clearProgress('a');
    expect(spy).toHaveBeenCalledTimes(3);
    off();
    setProgress('b', 0.4);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('clearing a missing entry does not notify', () => {
    const spy = vi.fn();
    onProgressChange(spy);
    clearProgress('missing');
    expect(spy).not.toHaveBeenCalled();
  });
});
