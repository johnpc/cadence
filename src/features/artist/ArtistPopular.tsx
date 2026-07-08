import { TrackRow } from '../player/TrackRow';
import { CollectionActions } from '../player/CollectionActions';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The artist's "Popular" tracks with play / shuffle / add-to-queue actions. */
export function ArtistPopular({ tracks }: { tracks: JellyfinItem[] }) {
  if (tracks.length === 0) return null;
  return (
    <section data-testid="artist-top">
      <div className="artist__popular-head">
        <h2 className="cad-kicker artist__section">Popular</h2>
        <CollectionActions tracks={tracks} />
      </div>
      {tracks.map((track, index) => (
        <TrackRow key={track.Id} track={track} queue={tracks} index={index} />
      ))}
    </section>
  );
}
