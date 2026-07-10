import { imageUrl } from '../../lib/jellyfinStream';
import { useDominantColor } from '../color/useDominantColor';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './ambientBackground.css';

/** A Spotify-style ambient wash behind the full player, sampled from the current
 * track's cover art. Sits under the content (absolute, aria-hidden) and fades
 * from the art colour at the top to the base background — so the art, title,
 * and controls read against a colour that belongs to the album. Falls back to
 * nothing (the base --cad-bg shows through) until the colour resolves. */
export function AmbientBackground({ item }: { item: JellyfinItem | null }) {
  const color = useDominantColor(item ? imageUrl(item, 64) : null);
  return (
    <div
      className="ambient-bg"
      data-testid="ambient-bg"
      aria-hidden="true"
      style={
        color
          ? { background: `linear-gradient(${color} 0%, transparent 55%)`, opacity: 1 }
          : undefined
      }
    />
  );
}
