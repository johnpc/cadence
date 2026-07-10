import { forwardRef } from 'react';
import type { LyricLine } from '../../lib/jellyfinLyrics';

/** One lyric line. When the line is timed (synced lyrics), it's a button that
 * seeks to its timestamp — tap a line to jump there, Spotify-style. Untimed
 * lines (plain lyrics) render as static text. The active line is highlighted. */
export const LyricLineRow = forwardRef<
  HTMLParagraphElement,
  {
    line: LyricLine;
    active: boolean;
    onSeek: (seconds: number) => void;
  }
>(function LyricLineRow({ line, active, onSeek }, ref) {
  const className = active ? 'lyrics__line lyrics__line--active' : 'lyrics__line';
  const text = line.text || ' ';
  if (line.start === undefined) {
    return (
      <p ref={ref} className={className} data-active={active ? 'true' : undefined}>
        {text}
      </p>
    );
  }
  return (
    <p ref={ref} className={className} data-active={active ? 'true' : undefined}>
      <button
        type="button"
        className="lyrics__seek"
        onClick={() => onSeek(line.start as number)}
        aria-label={`Play from “${line.text || 'this line'}”`}
      >
        {text}
      </button>
    </p>
  );
});
