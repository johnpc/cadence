/** How many pixels of scroll take the floating bar from clear to solid. */
export const BAR_FADE_PX = 24;

/** How far the floating page bar has faded in: 0 = clear (the page's own title
 * is in view), 1 = solid (the title has slid under the bar). It follows the
 * title's bottom edge across the bar's bottom edge over `fade` pixels, so the
 * compact title appears as the large one disappears. `lead` starts the fade
 * that many pixels early — a short detail page may not scroll far enough to
 * tuck its title fully under the bar. A page with no marked title keeps a
 * solid bar. */
export function barReveal(
  barBottom: number,
  titleBottom: number | null,
  lead = 0,
  fade = BAR_FADE_PX,
) {
  if (titleBottom === null) return 1;
  return Math.min(1, Math.max(0, (barBottom + lead - titleBottom) / fade));
}

/** The bar also fills over the last `fade` px of a page's scroll range, so a
 * short page whose title can never reach the bar still ends on a solid bar
 * instead of leaving its art half under a clear one. 0 at the top. */
export function endReveal(scrollTop: number, remaining: number, fade = BAR_FADE_PX) {
  if (scrollTop <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - remaining / fade));
}

/** The bar's state, for styling hooks and tests — one value, not two booleans. */
export type BarState = 'clear' | 'fading' | 'solid';

export function barState(reveal: number): BarState {
  if (reveal <= 0) return 'clear';
  return reveal >= 1 ? 'solid' : 'fading';
}
