/** The minimum horizontal travel (px) that counts as a deliberate swipe, above
 * which a small vertical wobble is still tolerated (ratio guard below). */
export const SWIPE_THRESHOLD = 60;

export type SwipeAction = 'next' | 'prev' | 'none';

/** Decide what a horizontal drag means: a left swipe advances (next), a right
 * swipe goes back (prev), and anything too short or too vertical is ignored so
 * a scroll or tap never skips the track. Pure so the thresholds are testable. */
export function swipeAction(dx: number, dy: number): SwipeAction {
  if (Math.abs(dx) < SWIPE_THRESHOLD) return 'none';
  if (Math.abs(dx) <= Math.abs(dy)) return 'none';
  return dx < 0 ? 'next' : 'prev';
}
