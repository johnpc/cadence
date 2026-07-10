import { Link } from 'react-router-dom';
import { usePlayContext } from './usePlayContext';

/** The Spotify-style "PLAYING FROM PLAYLIST · Chill Mix" header at the top of
 * the full player. Renders nothing unless the current track belongs to a known
 * collection context (so it self-hides once endless radio drifts off it). When
 * the context knows its route, the label links back to the source collection
 * (closing the player via onNavigate), like Spotify. */
export function PlayingFrom({
  trackId,
  onNavigate,
}: {
  trackId: string | undefined;
  onNavigate?: () => void;
}) {
  const ctx = usePlayContext(trackId);
  if (!ctx) return null;
  return (
    <div className="fullplayer__context" data-testid="playing-from">
      <span className="fullplayer__context-kind cad-kicker">Playing from {ctx.kind}</span>
      {ctx.path ? (
        <Link
          className="fullplayer__context-label fullplayer__context-link"
          to={ctx.path}
          onClick={onNavigate}
          data-testid="playing-from-link"
        >
          {ctx.label}
        </Link>
      ) : (
        <span className="fullplayer__context-label">{ctx.label}</span>
      )}
    </div>
  );
}
