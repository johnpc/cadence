import { Link } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { CollectionActions } from '../player/CollectionActions';
import { DownloadCollectionButton } from '../downloads/DownloadCollectionButton';
import { SaveButton } from '../library/SaveButton';
import { AlbumMenu } from './AlbumMenu';
import { GenreChips } from '../../components/GenreChips';
import { GradientHeader } from '../color/GradientHeader';
import { artistLine, collectionSummary } from '../player/playerFormat';
import { albumMeta } from './albumMeta';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** Title, artist (linked when we know its id), release meta and song count. */
function AlbumHeaderText({
  album,
  tracks,
}: {
  album: JellyfinItem | null;
  tracks: JellyfinItem[];
}) {
  const artistId = album?.ArtistItems?.[0]?.Id;
  const artistText = artistLine(album) || album?.AlbumArtist || '';
  const meta = albumMeta(album);
  return (
    <>
      <h1 className="album__title cad-headline">{album?.Name}</h1>
      {artistId ? (
        <Link className="album__artist cad-meta album__artist-link" to={`/artist/${artistId}`}>
          {artistText}
        </Link>
      ) : (
        <p className="album__artist cad-meta">{artistText}</p>
      )}
      {meta && (
        <p className="album__info cad-meta" data-testid="album-info">
          {meta}
        </p>
      )}
      {tracks.length > 0 && (
        <p className="album__summary cad-meta" data-testid="album-summary">
          {collectionSummary(tracks)}
        </p>
      )}
    </>
  );
}

/** The album header: art, title, artist, release meta, song count, genres, and
 * the save/play actions. Always renders once the album metadata is known — even
 * for an album Jellyfin reports 0 tracks for. */
export function AlbumHeader({
  album,
  tracks,
}: {
  album: JellyfinItem | null;
  tracks: JellyfinItem[];
}) {
  const context = {
    kind: 'album',
    label: album?.Name ?? 'Album',
    path: album?.Id ? `/album/${album.Id}` : undefined,
  };
  return (
    <GradientHeader item={album}>
      <div className="album__header">
        <TrackArt item={album} size={160} />
        <AlbumHeaderText album={album} tracks={tracks} />
        <GenreChips genres={album?.Genres} />
        {/* Secondary actions on the left, the Shuffle + Play pair on the right —
            one clear primary instead of seven equal icons (queue + share live
            in the "…" menu). */}
        <div className="album__actions">
          <div className="album__secondary">
            <SaveButton item={album} />
            <DownloadCollectionButton tracks={tracks} />
            {album && <AlbumMenu album={album} tracks={tracks} />}
          </div>
          {tracks.length > 0 && (
            <CollectionActions
              tracks={tracks}
              collectionId={album?.Id}
              context={context}
              withQueue={false}
            />
          )}
        </div>
      </div>
    </GradientHeader>
  );
}
