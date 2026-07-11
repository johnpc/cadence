import { LoadState } from '../../components/LoadState';
import { useLyrics } from '../player/useLyrics';
import { usePlayer } from '../player/usePlayer';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './songLyrics.css';

/** The song's lyrics on its detail page — read them without playing (Spotify
 * shows lyrics on the track page too). Synced (LRC) lines are tappable: tapping
 * one plays the track from that timestamp. Renders nothing when the track has no
 * lyrics, so a song without them doesn't show an empty section. */
export function SongLyrics({ song }: { song: JellyfinItem }) {
  const { lines, isLoading, isError, refetch } = useLyrics(song.Id, true);
  const { playQueue, seek } = usePlayer();
  // Nothing to show and not loading/erroring → omit the section entirely.
  if (!isLoading && !isError && lines.length === 0) return null;

  const playFrom = (seconds: number) => {
    playQueue([song], 0);
    // Let the track load before seeking to the tapped line.
    window.setTimeout(() => seek(seconds), 300);
  };

  return (
    <section data-testid="song-lyrics">
      <h2 className="cad-kicker song__section">Lyrics</h2>
      <LoadState
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
        isEmpty={false}
      >
        <div className="song-lyrics">
          {lines.map((line, i) =>
            line.start === undefined ? (
              <p key={i} className="song-lyrics__line">
                {line.text || ' '}
              </p>
            ) : (
              <button
                key={i}
                type="button"
                className="song-lyrics__line song-lyrics__line--seek"
                onClick={() => playFrom(line.start as number)}
                aria-label={`Play from “${line.text || 'this line'}”`}
              >
                {line.text || ' '}
              </button>
            ),
          )}
        </div>
      </LoadState>
    </section>
  );
}
