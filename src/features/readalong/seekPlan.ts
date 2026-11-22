/**
 * What tapping a sentence should do to the player, as ONE explicit decision:
 * seek within the current part, jump the queue to another part (then seek once
 * it loads), or nothing (the sentence isn't in the timeline / part not queued).
 */
import { clipForFragment, toPartPosition } from './timeline';
import type { ReadAlongBook } from './storytellerApi';

export type SeekPlan =
  | { kind: 'seek'; seconds: number }
  | { kind: 'jump'; queueIndex: number; itemId: string; seconds: number }
  | { kind: 'none' };

export function planSeek(input: {
  book: ReadAlongBook;
  chapter: number;
  fragment: string;
  currentItemId: string;
  queueIds: string[];
}): SeekPlan {
  const clip = clipForFragment(input.book.Clips, input.chapter, input.fragment);
  if (!clip) return { kind: 'none' };
  const target = toPartPosition(input.book.Parts, clip.Start);
  if (!target) return { kind: 'none' };
  if (target.itemId === input.currentItemId) return { kind: 'seek', seconds: target.seconds };
  const queueIndex = input.queueIds.indexOf(target.itemId);
  if (queueIndex === -1) return { kind: 'none' };
  return { kind: 'jump', queueIndex, itemId: target.itemId, seconds: target.seconds };
}
