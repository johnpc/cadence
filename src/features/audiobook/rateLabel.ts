/** A playback rate as the pill shows it: "1×", "1.5×", "0.75×" — no trailing
 * zeros, no float noise. */
export function rateLabel(rate: number): string {
  return `${Number(rate.toFixed(2))}×`;
}
