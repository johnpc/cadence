import { usePlayer } from './usePlayer';
import { artistLine } from './playerFormat';

/** A "Next: <song> · <artist>" hint at the foot of the full player, Spotify-
 * style, so you can see what's coming without opening the queue. Tapping it
 * opens the full Up Next queue. Renders nothing when nothing is queued next. */
export function NextUpHint({ onOpenQueue }: { onOpenQueue: () => void }) {
  const { queue, queueIndex } = usePlayer();
  const next = queue[queueIndex + 1];
  if (!next) return null;
  return (
    <button
      type="button"
      className="fullplayer__next-up"
      data-testid="full-player-next-up"
      onClick={onOpenQueue}
    >
      <span className="fullplayer__next-up-kind cad-kicker">Next</span>
      <span className="fullplayer__next-up-track">
        {next.Name}
        {artistLine(next) && <span className="cad-meta"> · {artistLine(next)}</span>}
      </span>
    </button>
  );
}
