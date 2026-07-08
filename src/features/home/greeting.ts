/** A time-of-day greeting for the Home header. Pure; `hour` is injected (0–23)
 * so it's deterministic in tests. */
export function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
