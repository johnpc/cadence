import { IonIcon } from '@ionic/react';
import { tv } from 'ionicons/icons';
import { TrackArt } from './TrackArt';
import { artistLine } from './playerFormat';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The mini-player's tappable art + title + subtitle. The subtitle shows the
 * artist, or a "casting to <device>" pill when a cast session is active. Tapping
 * opens the full player. */
export function NowPlayingMeta({
  track,
  casting,
  deviceName,
  onOpen,
}: {
  track: JellyfinItem;
  casting: boolean;
  deviceName: string;
  onOpen: () => void;
}) {
  return (
    <button className="npbar__open" onClick={onOpen} data-testid="now-playing-open">
      <TrackArt item={track} size={40} />
      <span className="npbar__meta">
        <span className="npbar__title" data-testid="now-playing-title">
          {track.Name}
        </span>
        <span className="npbar__artist">
          {casting ? (
            <span className="npbar__casting" data-testid="now-playing-cast">
              <IonIcon icon={tv} aria-hidden="true" /> {deviceName || 'TV'}
            </span>
          ) : (
            artistLine(track)
          )}
        </span>
      </span>
    </button>
  );
}
