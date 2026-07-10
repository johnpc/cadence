import { IonIcon } from '@ionic/react';
import { play, pause, shuffle as shuffleIcon, listOutline } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { useToast } from '../toast/useToast';
import { touchRecentPlay } from '../library/recentPlays';
import { setPlayContext } from './playContext';
import { isActiveQueue } from './isActiveQueue';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './collectionActions.css';

/** Play-all, shuffle-all, and add-to-queue for a collection (album, playlist,
 * likes). When this collection is already the active queue, the play button
 * becomes a pause/resume toggle (Spotify-style) instead of restarting from the
 * top. `collectionId`, when given, records a recent play so the collection
 * bubbles to the top of Your Library's default (recents) order. `context`, when
 * given, drives the full player's "Playing from …" header. */
export function CollectionActions({
  tracks,
  collectionId,
  context,
}: {
  tracks: JellyfinItem[];
  collectionId?: string;
  context?: { kind: string; label: string };
}) {
  const { playQueue, playShuffled, addToQueue, queue, isPlaying, toggle } = usePlayer();
  const toast = useToast();
  const isActive = isActiveQueue(tracks, queue);
  const showPause = isActive && isPlaying;
  const markPlayed = () => {
    if (collectionId) touchRecentPlay(collectionId, Date.now());
    if (context) setPlayContext({ ...context, tracks });
  };
  const onPlay = () => {
    // Already this collection's queue → toggle in place; else (re)start it.
    if (isActive) {
      toggle();
    } else {
      markPlayed();
      playQueue(tracks, 0);
    }
  };
  return (
    <div className="collection-actions">
      <button
        className="collection-actions__shuffle"
        data-testid="shuffle-all"
        onClick={() => {
          markPlayed();
          playShuffled(tracks);
        }}
        aria-label="Shuffle play"
      >
        <IonIcon icon={shuffleIcon} />
      </button>
      <button
        className="collection-actions__queue"
        data-testid="queue-all"
        onClick={() => {
          addToQueue(tracks);
          const n = tracks.length;
          toast(`Added ${n} ${n === 1 ? 'song' : 'songs'} to queue`);
        }}
        aria-label="Add to queue"
      >
        <IonIcon icon={listOutline} />
      </button>
      <button
        className="collection-actions__play"
        data-testid="play-all"
        onClick={onPlay}
        aria-label={showPause ? 'Pause' : 'Play'}
      >
        <IonIcon icon={showPause ? pause : play} />
      </button>
    </div>
  );
}
