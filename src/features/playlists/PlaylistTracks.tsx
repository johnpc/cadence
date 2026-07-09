import { IonSearchbar } from '@ionic/react';
import { useState } from 'react';
import { TrackRow } from '../player/TrackRow';
import { filterTracks } from './filterTracks';
import { useProgressiveList } from '../../lib/useProgressiveList';
import { useRemoveFromPlaylist, useMovePlaylistItem } from './playlistsApi';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** A playlist's tracklist with a "Find in playlist" filter. Reorder controls
 * show only in the unfiltered view (a filtered subset's indices wouldn't map
 * back to the real playlist); remove stays valid (keyed by PlaylistItemId). */
export function PlaylistTracks({
  playlistId,
  tracks,
}: {
  playlistId: string;
  tracks: JellyfinItem[];
}) {
  const [query, setQuery] = useState('');
  const remove = useRemoveFromPlaylist(playlistId);
  const move = useMovePlaylistItem(playlistId);
  const moveEntry = (entryId: string | undefined, index: number) => {
    if (entryId) move.mutate({ entryId, index });
  };
  const shown = filterTracks(tracks, query);
  const filtering = query.trim().length > 0;
  // Render a growing window so a huge playlist (hundreds of tracks) paints fast.
  const { limit, sentinelRef, hasMore } = useProgressiveList(shown.length);
  const visible = shown.slice(0, limit);

  return (
    <>
      {tracks.length > 8 && (
        <IonSearchbar
          className="playlist__search"
          value={query}
          debounce={0}
          placeholder="Find in playlist"
          onIonInput={(e) => setQuery(e.detail.value ?? '')}
          data-testid="playlist-search"
        />
      )}
      {visible.map((track) => {
        const index = tracks.indexOf(track);
        return (
          <TrackRow
            key={track.PlaylistItemId ?? track.Id}
            track={track}
            queue={shown}
            index={shown.indexOf(track)}
            onRemove={
              track.PlaylistItemId ? () => remove.mutate(track.PlaylistItemId as string) : undefined
            }
            reorder={
              filtering
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
