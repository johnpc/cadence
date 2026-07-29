import { TrackRow } from '../player/TrackRow';
import { BookRow } from '../audiobook/BookRow';
import { OfflineTile } from './OfflineTile';
import type { OfflineLibrary } from './offlineLibraryData';
import type { OfflineGroup } from './offlineGroups';
import type { OfflineSegment } from './useOfflineSegment';

const grid = (groups: OfflineGroup[], kind: string) => (
  <div className="offline-grid" data-testid="offline-grid">
    {groups.map((g) => (
      <OfflineTile key={g.id} group={g} kind={kind} />
    ))}
  </div>
);

/** Renders the active offline segment: a tile grid for playlists/artists/albums,
 * a book list for audiobooks, and a flat track list for songs. All content is
 * local — nothing here touches the network. */
export function OfflineSegmentView({
  segment,
  lib,
}: {
  segment: OfflineSegment;
  lib: OfflineLibrary;
}) {
  if (segment === 'playlists') return grid(lib.playlists, 'playlist');
  if (segment === 'artists') return grid(lib.artists, 'artist');
  if (segment === 'albums') return grid(lib.albums, 'album');
  if (segment === 'audiobooks') {
    return (
      <div data-testid="offline-audiobooks">
        {lib.audiobooks.map((b) => (
          <BookRow key={b.id} book={b} />
        ))}
      </div>
    );
  }
  return (
    <div data-testid="offline-songs">
      {lib.songs.map((track, index) => (
        <TrackRow
          key={track.Id}
          track={track}
          queue={lib.songs}
          index={index}
          context={{ kind: 'your library', label: 'Downloads' }}
        />
      ))}
    </div>
  );
}
