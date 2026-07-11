import { describe, expect, it } from 'vitest';
import { prevAction, PREV_RESTART_THRESHOLD } from './prevAction';

describe('prevAction', () => {
  it('goes to the previous track near the start', () => {
    expect(prevAction(0)).toBe('previous');
    expect(prevAction(PREV_RESTART_THRESHOLD)).toBe('previous');
  });

  it('restarts the current track once past the threshold', () => {
    expect(prevAction(PREV_RESTART_THRESHOLD + 0.1)).toBe('restart');
    expect(prevAction(120)).toBe('restart');
  });

  it('honours a custom threshold', () => {
    expect(prevAction(5, 10)).toBe('previous');
    expect(prevAction(15, 10)).toBe('restart');
  });
});
