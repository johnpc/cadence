import { IonIcon } from '@ionic/react';
import { play } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { Shelf } from './Shelf';
import { buildDailyMixes } from './dailyMix';
import { usePlayItem } from '../player/usePlayItem';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** "Made for you" — personalised mix cards seeded from followed artists. The
 * card body opens the seed artist's page; the play FAB starts that artist's
 * instant-mix radio. Renders nothing until the user follows ≥1 artist. */
export function DailyMixShelf({ artists }: { artists: JellyfinItem[] }) {
  const playItem = usePlayItem();
  const history = useHistory();
  const mixes = buildDailyMixes(artists);
  if (mixes.length === 0) return null;
  return (
    <Shelf
      title="Made for you"
      isLoading={false}
      isError={false}
      isEmpty={false}
      onRetry={() => {}}
    >
      {mixes.map(({ seed, title }) => (
        <div className="album-card album-card--round" data-testid="daily-mix" key={seed.Id}>
          <button
            type="button"
            className="album-card__hit"
            data-testid="daily-mix-hit"
            aria-label={`Open ${seed.Name}`}
            onClick={() => history.push(`/artist/${seed.Id}`)}
          >
            <TrackArt item={seed} size={140} round />
            <span className="album-card__title">{title}</span>
          </button>
          <button
            type="button"
            className="album-card__play"
            data-testid="daily-mix-play"
            aria-label={`Play ${title}`}
            onClick={() => void playItem(seed)}
          >
            <IonIcon icon={play} />
          </button>
        </div>
      ))}
    </Shelf>
  );
}
