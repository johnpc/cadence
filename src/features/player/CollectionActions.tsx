import { IonIcon } from '@ionic/react';
import { play, shuffle as shuffleIcon } from 'ionicons/icons';
import { usePlayer } from './usePlayer';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './collectionActions.css';

/** Play-all + shuffle-all buttons for a collection (album, playlist, likes). */
export function CollectionActions({ tracks }: { tracks: JellyfinItem[] }) {
  const { playQueue, playShuffled } = usePlayer();
  return (
    <div className="collection-actions">
      <button
        className="collection-actions__shuffle"
        data-testid="shuffle-all"
        onClick={() => playShuffled(tracks)}
        aria-label="Shuffle play"
      >
        <IonIcon icon={shuffleIcon} />
      </button>
      <button
        className="collection-actions__play"
        data-testid="play-all"
        onClick={() => playQueue(tracks, 0)}
        aria-label="Play"
      >
        <IonIcon icon={play} />
      </button>
    </div>
  );
}
