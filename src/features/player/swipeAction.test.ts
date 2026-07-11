import { describe, expect, it } from 'vitest';
import { swipeAction, SWIPE_THRESHOLD } from './swipeAction';

describe('swipeAction', () => {
  it('a long left drag means next', () => {
    expect(swipeAction(-(SWIPE_THRESHOLD + 20), 5)).toBe('next');
  });

  it('a long right drag means prev', () => {
    expect(swipeAction(SWIPE_THRESHOLD + 20, -5)).toBe('prev');
  });

  it('ignores a drag shorter than the threshold', () => {
    expect(swipeAction(SWIPE_THRESHOLD - 1, 0)).toBe('none');
    expect(swipeAction(-(SWIPE_THRESHOLD - 1), 0)).toBe('none');
  });

  it('ignores a mostly-vertical drag (a scroll, not a swipe)', () => {
    expect(swipeAction(-(SWIPE_THRESHOLD + 20), 200)).toBe('none');
  });

  it('treats a still pointer (tap) as no swipe', () => {
    expect(swipeAction(0, 0)).toBe('none');
  });
});
