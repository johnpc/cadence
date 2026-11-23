// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { BAR_FADE_PX, barReveal, barState, endReveal } from './barReveal';

describe('barReveal', () => {
  it('is clear while the title sits below the bar', () => {
    expect(barReveal(100, 140)).toBe(0);
    expect(barReveal(100, 100)).toBe(0);
  });

  it('fades in as the title slides under the bar, then stays solid', () => {
    expect(barReveal(100, 100 - BAR_FADE_PX / 2)).toBe(0.5);
    expect(barReveal(100, 100 - BAR_FADE_PX)).toBe(1);
    expect(barReveal(100, -400)).toBe(1);
  });

  it('is solid on a page with no title to follow', () => {
    expect(barReveal(100, null)).toBe(1);
  });

  it('starts early by the lead, and honours a custom fade distance', () => {
    expect(barReveal(100, 132, 32)).toBe(0);
    expect(barReveal(100, 100, 32)).toBe(1);
    expect(barReveal(100, 90, 0, 40)).toBe(0.25);
  });
});

describe('barState', () => {
  it('names the three phases', () => {
    expect(barState(0)).toBe('clear');
    expect(barState(0.4)).toBe('fading');
    expect(barState(1)).toBe('solid');
  });
});

describe('endReveal', () => {
  it('fills over the last stretch of a short page, never at the top', () => {
    expect(endReveal(0, 0)).toBe(0);
    expect(endReveal(80, BAR_FADE_PX)).toBe(0);
    expect(endReveal(80, BAR_FADE_PX / 2)).toBe(0.5);
    expect(endReveal(80, 0)).toBe(1);
    expect(endReveal(80, 400)).toBe(0);
  });
});
