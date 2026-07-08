/**
 * The app's single source of randomness. Isolating it here keeps `Math.random`
 * out of logic files so callers can inject a deterministic stub in tests.
 */
export function random(): number {
  return Math.random();
}
