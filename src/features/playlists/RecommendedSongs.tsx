import { IonIcon } from '@ionic/react';
import { addCircleOutline, closeOutline } from 'ionicons/icons';
import { Link } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { artistLine } from '../player/playerFormat';
import { usePlaylistRecs } from './usePlaylistRecs';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** "Recommended songs to add" — instant-mix picks seeded on the playlist, each
 * with an Add button and a Dismiss action that swaps in the next candidate. */
export function RecommendedSongs({
  playlistId,
  tracks,
}: {
  playlistId: string;
  tracks: JellyfinItem[];
}) {
  const { recommendations, addRec, dismissRecommendation } = usePlaylistRecs(playlistId, tracks);
  if (recommendations.length === 0) return null;
  return (
    <section className="playlist-recs" data-testid="playlist-recs">
      <h2 className="cad-kicker playlist-recs__title">Recommended songs to add</h2>
      {recommendations.map((track) => (
        <div className="playlist-rec" data-testid="playlist-rec" key={track.Id}>
          <Link className="playlist-rec__info" to={`/song/${track.Id}`}>
            <TrackArt item={track} size={44} />
            <span className="playlist-rec__meta">
              <span className="playlist-rec__name">{track.Name}</span>
              <span className="playlist-rec__artist cad-meta">{artistLine(track)}</span>
            </span>
          </Link>
          <button
            type="button"
            className="playlist-rec__add"
            data-testid="rec-add"
            aria-label={`Add ${track.Name}`}
            onClick={() => addRec(track)}
          >
            <IonIcon icon={addCircleOutline} />
          </button>
          <button
            type="button"
            className="playlist-rec__dismiss"
            data-testid="rec-dismiss"
            aria-label={`Dismiss ${track.Name}`}
            onClick={() => dismissRecommendation(track)}
          >
            <IonIcon icon={closeOutline} />
          </button>
        </div>
      ))}
    </section>
  );
}
