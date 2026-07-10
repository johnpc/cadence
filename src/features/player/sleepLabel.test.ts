import { describe, expect, it } from 'vitest';
import { sleepLabel } from './sleepLabel';

describe('sleepLabel', () => {
  it('is null when the timer is off', () => {
    expect(sleepLabel(null)).toBeNull();
  });

  it('labels a minute countdown', () => {
    expect(sleepLabel(15)).toBe('Sleep in 15 min');
    expect(sleepLabel(60)).toBe('Sleep in 60 min');
  });

  it('labels end-of-track mode', () => {
    expect(sleepLabel('track')).toBe('Sleep after this track');
  });
});
