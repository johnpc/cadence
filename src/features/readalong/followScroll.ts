/**
 * How the sheet keeps the narrated sentence in view. ONE decision per highlight
 * change, as a union — never ad-hoc scrollIntoView calls:
 *
 * - `jump`   — instant reposition (opening the sheet, a new chapter): the reader
 *              should land on the sentence, not watch the page travel to it.
 * - `smooth` — a gentle catch-up, only once the sentence has drifted out of the
 *              comfortable reading band (its bottom below 72 % of the view or its
 *              top above 12 %). Narration then reads several sentences in place
 *              before the page moves, instead of sliding on every sentence.
 * - `none`   — the sentence is already in the band; leave the page alone.
 *
 * `to` puts the sentence's top at 30 % of the viewport. Pure: geometry in,
 * decision out. Y values are in the scroller's content coordinates.
 */
export type FollowReason = 'open' | 'chapter' | 'tick';

export type FollowScrollDecision =
  { kind: 'none' } | { kind: 'jump'; to: number } | { kind: 'smooth'; to: number };

export const ANCHOR_FRACTION = 0.3;
export const LOW_BAND = 0.12;
export const HIGH_BAND = 0.72;

export function followScroll(input: {
  activeTop: number;
  activeBottom: number;
  viewTop: number;
  viewHeight: number;
  reason: FollowReason;
}): FollowScrollDecision {
  const { activeTop, activeBottom, viewTop, viewHeight, reason } = input;
  const to = Math.max(0, activeTop - viewHeight * ANCHOR_FRACTION);
  if (reason !== 'tick') return { kind: 'jump', to };
  const topFraction = (activeTop - viewTop) / viewHeight;
  const bottomFraction = (activeBottom - viewTop) / viewHeight;
  if (bottomFraction > HIGH_BAND || topFraction < LOW_BAND) return { kind: 'smooth', to };
  return { kind: 'none' };
}
