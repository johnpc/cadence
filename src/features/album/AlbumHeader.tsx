import { Link } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { CollectionActions } from '../player/CollectionActions';
import { DownloadCollectionButton } from '../downloads/DownloadCollectionButton';
import { SaveButton } from '../library/SaveButton';
import { ShareButton } from '../share/ShareButton';
import { GenreChips } from '../../components/GenreChips';
import { GradientHeader } from '../color/GradientHeader';
import { artistLine, collectionSummary } from '../player/playerFormat';
import { albumMeta } from './albumMeta';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The album header: art, title, artist (linked when we have its id), release
 * meta, song count, genres, and the save/play actions. Always renders once the
 * album metadata is known — even for an album Jellyfin reports 0 tracks for. */
export function AlbumHeader({
  album,
  tracks,
}: {
  album: JellyfinItem | null;
  tracks: JellyfinItem[];
}) {
  const artistId = album?.ArtistItems?.[0]?.Id;
  const artistText = artistLine(album) || album?.AlbumArtist || '';
  return (
    <GradientHeader item={album}>
      <div className="album__header">
        <TrackArt item={album} size={160} />
        <h1 className="album__title cad-headline">{album?.Name}</h1>
        {artistId ? (
          <Link className="album__artist cad-meta album__artist-link" to={`/artist/${artistId}`}>
            {artistText}
          </Link>
        ) : (
          <p className="album__artist cad-meta">{artistText}</p>
        )}
        {albumMeta(album) && (
          <p className="album__info cad-meta" data-testid="album-info">
            {albumMeta(album)}
          </p>
        )}
        {tracks.length > 0 && (
          <p className="album__summary cad-meta" data-testid="album-summary">
            {collectionSummary(tracks)}
          </p>
        )}
        <GenreChips genres={album?.Genres} />
        <div className="album__actions">
          <SaveButton item={album ?? null} />
          <DownloadCollectionButton tracks={tracks} />
          <ShareButton item={album ?? null} />
          {tracks.length > 0 && (
            <CollectionActions
              tracks={tracks}
              collectionId={album?.Id}
              context={{
                kind: 'album',
                label: album?.Name ?? 'Album',
                path: album?.Id ? `/album/${album.Id}` : undefined,
              }}
            />
          )}
        </div>
      </div>
    </GradientHeader>
  );
}
