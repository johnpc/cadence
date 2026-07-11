import { Link } from 'react-router-dom';
import { TrackRow } from '../player/TrackRow';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The artist's "Popular" tracks (a short preview). Play/shuffle for them lives
 * in the artist header (Spotify-style), so this section is just the ranked
 * tracklist + a "See all" link to the full A–Z catalogue. */
export function ArtistPopular({
  tracks,
  artistId,
  artistName,
}: {
  tracks: JellyfinItem[];
  artistId?: string;
  artistName?: string;
}) {
  if (tracks.length === 0) return null;
  const id = artistId ?? tracks[0]?.ArtistItems?.[0]?.Id;
  const ctx = {
    kind: 'artist',
    label: artistName ?? 'Artist',
    path: id ? `/artist/${id}` : undefined,
  };
  return (
    <section data-testid="artist-top">
      <div className="artist__section-head">
        <h2 className="cad-kicker artist__section">Popular</h2>
        {id && (
          <Link
            className="artist__see-all"
            to={`/artist/${id}/tracks`}
            data-testid="artist-see-all"
          >
            See all
          </Link>
        )}
      </div>
      {tracks.map((track, index) => (
        <TrackRow key={track.Id} track={track} queue={tracks} index={index} context={ctx} />
      ))}
    </section>
  );
}
