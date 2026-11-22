import { describe, expect, it } from 'vitest';
import { followScroll } from './followScroll';

describe('followScroll', () => {
  const view = { viewTop: 1000, viewHeight: 800 };

  it('jumps on open and on a chapter change, placing the sentence at 30 % of the view', () => {
    expect(followScroll({ ...view, activeTop: 5000, activeBottom: 5040, reason: 'open' })).toEqual({
      kind: 'jump',
      to: 5000 - 240,
    });
    expect(followScroll({ ...view, activeTop: 100, activeBottom: 140, reason: 'chapter' })).toEqual(
      { kind: 'jump', to: 0 },
    );
  });

  it('leaves the page alone while the sentence sits in the reading band', () => {
    // top at 20 % and bottom at 50 % of the view → inside [12 %, 72 %]
    expect(followScroll({ ...view, activeTop: 1160, activeBottom: 1400, reason: 'tick' })).toEqual({
      kind: 'none',
    });
  });

  it('catches up smoothly once the sentence drifts below 72 % of the view', () => {
    expect(followScroll({ ...view, activeTop: 1500, activeBottom: 1600, reason: 'tick' })).toEqual({
      kind: 'smooth',
      to: 1500 - 240,
    });
  });

  it('catches up smoothly when the sentence is above the band (reader scrolled past, then followed again)', () => {
    expect(followScroll({ ...view, activeTop: 1020, activeBottom: 1060, reason: 'tick' })).toEqual({
      kind: 'smooth',
      to: 1020 - 240,
    });
  });
});
