import type { GrabResult } from './grabTypes';

/** A short quality label from a result's score. Music Grabber ranks lossless/
 * Tidal highest; we bucket the score into a human badge. Pure + testable. */
export function qualityBadge(result: GrabResult): { label: string; lossless: boolean } {
  const score = result.quality_score ?? 0;
  if (score >= 120) return { label: 'Lossless', lossless: true };
  if (score >= 80) return { label: 'High', lossless: false };
  return { label: 'Standard', lossless: false };
}

/** "3:45" from a duration in seconds, or '' when unknown. */
export function formatDuration(seconds: number | null): string {
  if (!seconds || seconds <= 0) return '';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
