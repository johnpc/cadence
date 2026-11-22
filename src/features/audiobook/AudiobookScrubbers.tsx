import { useBookProgress } from './useBookProgress';
import { BookProgressBars } from './BookProgressBars';

/** The full player's progress for an audiobook: chapter bar + book bar, wired to
 * the live player. Renders nothing for music (the player keeps its single
 * scrubber there). */
export function AudiobookScrubbers() {
  const { model, rate, seekBook } = useBookProgress();
  if (!model) return null;
  return <BookProgressBars model={model} rate={rate} onSeekBook={seekBook} />;
}
