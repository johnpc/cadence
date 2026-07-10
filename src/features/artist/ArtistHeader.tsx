import { IonIcon } from '@ionic/react';
import { radio } from 'ionicons/icons';
import { TrackArt } from '../player/TrackArt';
import { CollectionActions } from '../player/CollectionActions';
import { GenreChips } from '../../components/GenreChips';
import { GradientHeader } from '../color/GradientHeader';
import { SaveButton } from '../library/SaveButton';
import { ShareButton } from '../share/ShareButton';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The artist header: circular art over an ambient gradient, name, genres, and
 * the primary actions — follow, share, radio, and (when the artist has popular
 * tracks) a prominent play/shuffle for them, Spotify-style. */
export function ArtistHeader({
  artist,
  topTracks,
  onRadio,
}: {
  artist: JellyfinItem | null;
  topTracks: JellyfinItem[];
  onRadio: () => void;
}) {
  return (
    <GradientHeader item={artist}>
      <div className="artist__header">
        <TrackArt item={artist} size={160} round />
        <h1 className="artist__name cad-headline">{artist?.Name}</h1>
        <GenreChips genres={artist?.Genres} />
        {artist && (
          <div className="artist__actions" data-testid="artist-actions">
            <SaveButton item={artist} />
            <ShareButton item={artist} />
            <button
              className="artist__radio"
              data-testid="artist-radio"
              onClick={onRadio}
              aria-label="Start artist radio"
            >
              <IonIcon icon={radio} /> Radio
            </button>
            {topTracks.length > 0 && (
              <CollectionActions
                tracks={topTracks}
                context={{
                  kind: 'artist',
                  label: artist.Name ?? 'Artist',
                  path: artist.Id ? `/artist/${artist.Id}` : undefined,
                }}
              />
            )}
          </div>
        )}
      </div>
    </GradientHeader>
  );
}
