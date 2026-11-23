import { useBookProgress } from './useBookProgress';
import { BookProgressBars } from './BookProgressBars';
import { usePlayerProgress } from '../player/PlayerProgressContext';
import { usePlayer } from '../player/usePlayer';
import { useChapters } from './useChapters';
import { AudiobookSeekButtons } from './AudiobookSeekButtons';

/** The full player's audiobook block: chapter bar + book bar, then the ±30 s
 * buttons with the speed pill between them, wired to the live player. Lazy with
 * the first audiobook (keeps it out of the entry chunk). Renders nothing for
 * music (the player keeps its single scrubber there). */
export function AudiobookScrubbers({ onOpenChapters }: { onOpenChapters?: () => void }) {
  const { model, rate, seekBook } = useBookProgress();
  const { phase } = usePlayerProgress();
  // Only real chapter markers have a list worth opening; a parts-only book's
  // "Part 2 of 3" label stays plain text.
  const { chapters } = useChapters(usePlayer().current);
  if (!model) return null;
  // The full player already shows the book's title as its headline, so the book
  // bar just says "Book" — no repeated, truncated title.
  return (
    <>
      <BookProgressBars
        model={model}
        rate={rate}
        phase={phase}
        bookLabel="Book"
        onSeekBook={seekBook}
        onChapterLabel={chapters.length > 0 ? onOpenChapters : undefined}
      />
      <AudiobookSeekButtons />
    </>
  );
}
