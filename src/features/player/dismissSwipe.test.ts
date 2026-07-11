import { describe, expect, it } from 'vitest';
import { isDismissSwipe, DISMISS_THRESHOLD } from './dismissSwipe';

describe('isDismissSwipe', () => {
  it('a long downward drag dismisses', () => {
    expect(isDismissSwipe(5, DISMISS_THRESHOLD + 20)).toBe(true);
  });

  it('ignores an upward drag', () => {
    expect(isDismissSwipe(0, -(DISMISS_THRESHOLD + 20))).toBe(false);
  });

  it('ignores a downward drag shorter than the threshold', () => {
    expect(isDismissSwipe(0, DISMISS_THRESHOLD - 1)).toBe(false);
  });

  it('ignores a mostly-horizontal drag (a track swipe, not a dismiss)', () => {
    expect(isDismissSwipe(200, DISMISS_THRESHOLD + 20)).toBe(false);
  });

  it('treats a tap as no dismiss', () => {
    expect(isDismissSwipe(0, 0)).toBe(false);
  });
});
