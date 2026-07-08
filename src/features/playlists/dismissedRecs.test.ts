import { afterEach, describe, expect, it } from 'vitest';
import { getDismissedRecs, dismissRec } from './dismissedRecs';

afterEach(() => {
  localStorage.clear();
});

describe('dismissedRecs', () => {
  it('returns an empty list for a playlist with no dismissals', () => {
    expect(getDismissedRecs('p1')).toEqual([]);
  });

  it('persists dismissed track ids per playlist', () => {
    dismissRec('p1', 'a');
    dismissRec('p1', 'b');
    dismissRec('p2', 'c');
    expect(getDismissedRecs('p1').sort()).toEqual(['a', 'b']);
    expect(getDismissedRecs('p2')).toEqual(['c']);
  });

  it('does not store duplicates', () => {
    dismissRec('p1', 'a');
    dismissRec('p1', 'a');
    expect(getDismissedRecs('p1')).toEqual(['a']);
  });

  it('ignores empty ids', () => {
    dismissRec('p1', '');
    dismissRec('', 'a');
    expect(getDismissedRecs('p1')).toEqual([]);
  });

  it('tolerates corrupt storage', () => {
    localStorage.setItem('cadence.dismissed-recs', 'not json');
    expect(getDismissedRecs('p1')).toEqual([]);
  });
});
