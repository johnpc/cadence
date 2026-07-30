import type { BookProgress } from './bookProgress';

/** "3h 10m" / "12m" — a compact hours-minutes duration (no "left" suffix). */
export function hoursMinutes(seconds: number): string {
  const totalMin = Math.max(0, Math.round(seconds / 60));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * The book-cell progress phrase: "Finished" when completed, "NN% · Xh Ym left"
 * once started, or null before any listening (so the row stays clean). Pure.
 */
export function bookProgressLabel(p: BookProgress): string | null {
  if (p.completed) return 'Finished';
  if (!p.started) return null;
  const pct = Math.round(p.fraction * 100);
  return `${pct}% · ${hoursMinutes(p.remainingSeconds)} left`;
}
