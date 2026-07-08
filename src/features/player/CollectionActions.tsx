import { IonIcon } from '@ionic/react';
import { play, shuffle as shuffleIcon, listOutline } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import { useToast } from '../toast/useToast';
import { touchRecentPlay } from '../library/recentPlays';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './collectionActions.css';

/** Play-all, shuffle-all, and add-to-queue for a collection (album, playlist,
 * likes). `collectionId`, when given, records a recent play so the collection
 * bubbles to the top of Your Library's default (recents) order. */
export function CollectionActions({
  tracks,
  collectionId,
}: {
  tracks: JellyfinItem[];
  collectionId?: string;
}) {
  const { playQueue, playShuffled, addToQueue } = usePlayer();
  const toast = useToast();
  const markPlayed = () => {
    if (collectionId) touchRecentPlay(collectionId, Date.now());
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
          toast(`Added ${tracks.length} to queue`);
        }}
        aria-label="Add to queue"
      >
        <IonIcon icon={listOutline} />
      </button>
      <button
        className="collection-actions__play"
        data-testid="play-all"
        onClick={() => {
          markPlayed();
          playQueue(tracks, 0);
        }}
        aria-label="Play"
      >
        <IonIcon icon={play} />
      </button>
    </div>
  );
}
