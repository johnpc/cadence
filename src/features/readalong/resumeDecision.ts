/**
 * Which saved position an audiobook part should resume from, as ONE decision.
 * Inputs: the local Jellyfin position (already passed through resumeSeconds'
 * guards) and the plugin's shared position (the newer of Storyteller's and
 * Jellyfin's, on the GLOBAL clock). Storyteller wins only when it is the newer
 * source AND lands inside THIS part — a position in another part is the book
 * header's job (resumePartIndex), not a mid-load seek.
 */
import { toPartPosition } from './timeline';
import type { ReadAlongPart, SharedPosition } from './storytellerApi';

export type ResumeDecision =
  | { source: 'none' }
  | { source: 'jellyfin'; seconds: number }
  | { source: 'storyteller'; seconds: number };

const MIN_RESUME_SECONDS = 5;
const END_MARGIN_SECONDS = 15;

export function decideResume(input: {
  local: number | null;
  shared: SharedPosition | null;
  parts: ReadAlongPart[];
  itemId: string;
  durationSeconds: number;
}): ResumeDecision {
  const fromLocal: ResumeDecision =
    input.local === null ? { source: 'none' } : { source: 'jellyfin', seconds: input.local };
  if (!input.shared || input.shared.Source !== 'storyteller') return fromLocal;
  const target = toPartPosition(input.parts, input.shared.Seconds);
  if (!target || target.itemId !== input.itemId) return fromLocal;
  if (target.seconds < MIN_RESUME_SECONDS) return fromLocal;
  if (input.durationSeconds > 0 && target.seconds > input.durationSeconds - END_MARGIN_SECONDS) {
    return fromLocal;
  }
  return { source: 'storyteller', seconds: target.seconds };
}
