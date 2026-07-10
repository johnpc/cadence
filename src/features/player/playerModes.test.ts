import { afterEach, describe, expect, it } from 'vitest';
import { loadModes, saveModes, nextRepeat } from './playerModes';

describe('playerModes', () => {
  afterEach(() => localStorage.clear());

  it('defaults to shuffle off, repeat off', () => {
    expect(loadModes()).toEqual({ shuffle: false, repeat: 'off' });
  });

  it('nextRepeat cycles off → all → one → off', () => {
    expect(nextRepeat('off')).toBe('all');
    expect(nextRepeat('all')).toBe('one');
    expect(nextRepeat('one')).toBe('off');
  });

  it('round-trips shuffle + repeat', () => {
    saveModes({ shuffle: true, repeat: 'all' });
    expect(loadModes()).toEqual({ shuffle: true, repeat: 'all' });
  });

  it('rejects an invalid repeat value', () => {
    localStorage.setItem('cadence.modes', JSON.stringify({ shuffle: true, repeat: 'bogus' }));
    expect(loadModes()).toEqual({ shuffle: true, repeat: 'off' });
  });

  it('tolerates corrupt storage', () => {
    localStorage.setItem('cadence.modes', 'not json');
    expect(loadModes()).toEqual({ shuffle: false, repeat: 'off' });
  });
});
