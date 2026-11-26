import { lazy, Suspense } from 'react';
import { IonIcon } from '@ionic/react';
import { ellipsisHorizontal } from 'ionicons/icons';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const Menu = lazy(() => import('./NowPlayingMenu').then((m) => ({ default: m.NowPlayingMenu })));

/**
 * The full player's "…" menu, loaded on demand: its action sheets, playlist
 * picker and new-playlist alert stay out of the app entry chunk (50 kB gzipped
 * budget, .size-limit.json). The full player mounts with the first track, so
 * the chunk is fetched long before anyone taps More; until then the fallback is
 * the same button, inert, so the footer never shifts.
 */
export function LazyNowPlayingMenu(props: { track: JellyfinItem; onNavigate: () => void }) {
  return (
    <Suspense
      fallback={
        <button type="button" className="fullplayer__foot-btn" aria-label="More options" disabled>
          <IonIcon icon={ellipsisHorizontal} /> More
        </button>
      }
    >
      <Menu {...props} />
    </Suspense>
  );
}
