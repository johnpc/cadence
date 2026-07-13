import { useMemo, useState } from 'react';
import { TrackRow } from '../player/TrackRow';
import { buildPlaylistIndex, reorderProps, removeHandler } from './playlistIndexMap';
import { PlaylistTools } from './PlaylistTools';
import { filterTracks } from './filterTracks';
import { sortPlaylistTracks, type PlaylistSort } from './sortPlaylistTracks';
import { useProgressiveList } from '../../lib/useProgressiveList';
import { usePlaylistTrackMutations } from './usePlaylistTrackMutations';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** A playlist's tracklist with a "Find in playlist" filter + a sort selector.
 * Reorder controls show only in the unfiltered, custom-order view (a filtered
 * subset or a re-sorted view wouldn't map back to the real playlist order);
 * remove stays valid always (keyed by PlaylistItemId). */
export function PlaylistTracks({
  playlistId,
  playlistName,
  tracks,
  editable = true,
}: {
  playlistId: string;
  playlistName?: string;
  tracks: JellyfinItem[];
  /** Owner-only: show remove + reorder. Off for cloned/community playlists you
   * don't own (those mutations would 403). */
  editable?: boolean;
}) {
  const ctx = {
    kind: 'playlist',
    label: playlistName ?? 'Playlist',
    path: `/playlist/${playlistId}`,
  };
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<PlaylistSort>('custom');
  const { removeEntry, moveEntry } = usePlaylistTrackMutations(playlistId);
  const shown = sortPlaylistTracks(filterTracks(tracks, query), sort);
  const filtering = query.trim().length > 0;
  // Reorder only makes sense in the saved (custom) order, unfiltered — a sorted
  // or filtered view's row positions don't map to the real playlist indices.
  const reorderable = editable && !filtering && sort === 'custom';
  // Precompute each track's index in the FULL playlist once (O(n)); see
  // buildPlaylistIndex for why (per-row indexOf was O(n²)). The play queue's
  // index is just the row's own map index, so no lookup is needed there.
  const playlistIndex = useMemo(() => buildPlaylistIndex(tracks), [tracks]);
  // Render a growing window so a huge playlist (hundreds of tracks) paints fast.
  const { limit, sentinelRef, hasMore } = useProgressiveList(shown.length);
  const visible = shown.slice(0, limit);

  return (
    <>
      {tracks.length > 8 && (
        <PlaylistTools query={query} onQuery={setQuery} sort={sort} onSort={setSort} />
      )}
      {visible.map((track, i) => {
        const index = playlistIndex.get(track) ?? i;
        return (
          <TrackRow
            key={track.PlaylistItemId ?? track.Id}
            track={track}
            queue={shown}
            index={i}
            context={ctx}
            onRemove={removeHandler(editable, track.PlaylistItemId, removeEntry)}
            reorder={reorderProps(reorderable, index, tracks.length, (to) =>
              moveEntry(track.PlaylistItemId, to),
            )}
          />
        );
      })}
      {hasMore && <div ref={sentinelRef} data-testid="playlist-load-more" aria-hidden="true" />}
      {filtering && shown.length === 0 && (
        <p className="cad-meta" data-testid="playlist-no-matches">
          No songs match “{query}”.
        </p>
      )}
    </>
  );
}
