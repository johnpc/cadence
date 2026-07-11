/** Minimum downward travel (px) that counts as a deliberate dismiss drag. */
export const DISMISS_THRESHOLD = 80;

/** True when a drag is a deliberate downward flick: far enough down and more
 * vertical than horizontal (so a horizontal swipe or a small wobble doesn't
 * dismiss the sheet). Pure so the thresholds are unit-testable. */
export function isDismissSwipe(dx: number, dy: number): boolean {
  if (dy < DISMISS_THRESHOLD) return false;
  return dy > Math.abs(dx);
}
