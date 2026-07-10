import { TrackRow } from '../player/TrackRow';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The artist's "Popular" tracks. Play/shuffle for them lives in the artist
 * header (Spotify-style), so this section is just the ranked tracklist. */
export function ArtistPopular({
  tracks,
  artistName,
}: {
  tracks: JellyfinItem[];
  artistName?: string;
}) {
  if (tracks.length === 0) return null;
  const artistId = tracks[0]?.ArtistItems?.[0]?.Id;
  const ctx = {
    kind: 'artist',
    label: artistName ?? 'Artist',
    path: artistId ? `/artist/${artistId}` : undefined,
  };
  return (
    <section data-testid="artist-top">
      <h2 className="cad-kicker artist__section">Popular</h2>
      {tracks.map((track, index) => (
        <TrackRow key={track.Id} track={track} queue={tracks} index={index} context={ctx} />
      ))}
    </section>
  );
}
