import { usePlayContext } from './usePlayContext';

/** The Spotify-style "PLAYING FROM PLAYLIST · Chill Mix" header at the top of
 * the full player. Renders nothing unless the current track belongs to a known
 * collection context (so it self-hides once endless radio drifts off it). */
export function PlayingFrom({ trackId }: { trackId: string | undefined }) {
  const ctx = usePlayContext(trackId);
  if (!ctx) return null;
  return (
    <div className="fullplayer__context" data-testid="playing-from">
      <span className="fullplayer__context-kind cad-kicker">Playing from {ctx.kind}</span>
      <span className="fullplayer__context-label">{ctx.label}</span>
    </div>
  );
}
