import { useState } from 'react';
import { TrackRow } from '../player/TrackRow';
import { PlaylistTools } from './PlaylistTools';
import { filterTracks } from './filterTracks';
import { sortPlaylistTracks, type PlaylistSort } from './sortPlaylistTracks';
import { useProgressiveList } from '../../lib/useProgressiveList';
import { useRemoveFromPlaylist, useMovePlaylistItem } from './playlistsApi';
import { useToast } from '../toast/useToast';
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
  const toast = useToast();
  const remove = useRemoveFromPlaylist(playlistId);
  const move = useMovePlaylistItem(playlistId);
  const onErr = (msg: string) => ({ onError: () => toast(msg) });
  const removeEntry = (entryId: string) =>
    remove.mutate(entryId, onErr("Couldn't remove that song"));
  const moveEntry = (entryId: string | undefined, index: number) => {
    if (entryId) move.mutate({ entryId, index }, onErr("Couldn't reorder the playlist"));
  };
  const shown = sortPlaylistTracks(filterTracks(tracks, query), sort);
  const filtering = query.trim().length > 0;
  // Reorder only makes sense in the saved (custom) order, unfiltered — a sorted
  // or filtered view's row positions don't map to the real playlist indices.
  const reorderable = editable && !filtering && sort === 'custom';
  // Render a growing window so a huge playlist (hundreds of tracks) paints fast.
  const { limit, sentinelRef, hasMore } = useProgressiveList(shown.length);
  const visible = shown.slice(0, limit);

  return (
    <>
      {tracks.length > 8 && (
        <PlaylistTools query={query} onQuery={setQuery} sort={sort} onSort={setSort} />
      )}
      {visible.map((track) => {
        const index = tracks.indexOf(track);
        return (
          <TrackRow
            key={track.PlaylistItemId ?? track.Id}
            track={track}
            queue={shown}
            index={shown.indexOf(track)}
            context={ctx}
            onRemove={
              editable && track.PlaylistItemId
                ? () => removeEntry(track.PlaylistItemId as string)
                : undefined
            }
            reorder={
              !reorderable
                ? undefined
                : {
                    isFirst: index === 0,
                    isLast: index === tracks.length - 1,
                    onMoveUp: () => moveEntry(track.PlaylistItemId, index - 1),
                    onMoveDown: () => moveEntry(track.PlaylistItemId, index + 1),
                  }
            }
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
