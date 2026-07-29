import { IonIcon } from '@ionic/react';
import { play } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { usePlayer } from '../player/usePlayer';
import { setPlayContext } from '../player/playContext';
import type { OfflineGroup } from './offlineGroups';
import '../home/home.css';

/** A grid tile for a downloaded album / artist / playlist in the offline library.
 * Tapping the body opens the group's offline track list; the green FAB plays it
 * immediately. All data is local — no server needed. `kind` drives the route and
 * the "Playing from" label. */
export function OfflineTile({ group, kind }: { group: OfflineGroup; kind: string }) {
  const history = useHistory();
  const { playQueue } = usePlayer();
  const open = () => history.push(`/offline/${kind}/${encodeURIComponent(group.id)}`);
  const play_ = () => {
    setPlayContext({ kind, label: group.title, tracks: group.tracks });
    playQueue(group.tracks, 0);
  };
  return (
    <div
      className={group.round ? 'album-card album-card--round' : 'album-card'}
      data-testid="offline-tile"
    >
      <button
        type="button"
        className="album-card__hit"
        onClick={open}
        aria-label={`Open ${group.title}`}
      >
        <TrackArt item={group.art} size={140} round={group.round} />
        <span className="album-card__title">{group.title}</span>
        <span className="album-card__artist">{group.subtitle}</span>
      </button>
      <button
        type="button"
        className="album-card__play"
        onClick={play_}
        aria-label={`Play ${group.title}`}
      >
        <IonIcon icon={play} />
      </button>
    </div>
  );
}
