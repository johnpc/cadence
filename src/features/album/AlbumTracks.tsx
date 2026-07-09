import { TrackRow } from '../player/TrackRow';
import { groupByDisc, isMultiDisc } from './albumDiscs';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** An album's tracklist. Multi-disc albums (box sets, deluxe editions) get
 * Spotify-style "Disc N" headers; single-disc albums render a flat list. Every
 * row plays the whole album as its queue — the disc grouping is display-only,
 * so `index` stays the track's position in the flat album, not within its disc. */
export function AlbumTracks({ tracks }: { tracks: JellyfinItem[] }) {
  const discs = groupByDisc(tracks);
  if (!isMultiDisc(discs)) {
    return (
      <>
        {tracks.map((track, index) => (
          <TrackRow key={track.Id} track={track} queue={tracks} index={index} showNumber />
        ))}
      </>
    );
  }
  return (
    <>
      {discs.map((disc) => (
        <div key={disc.disc} data-testid="album-disc">
          <h2 className="cad-kicker album__disc" data-testid="album-disc-heading">
            Disc {disc.disc}
          </h2>
          {disc.tracks.map(({ track, index }) => (
            <TrackRow key={track.Id} track={track} queue={tracks} index={index} showNumber />
          ))}
        </div>
      ))}
    </>
  );
}
