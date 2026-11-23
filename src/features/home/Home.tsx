import { IonRefresher, IonRefresherContent, type RefresherCustomEvent } from '@ionic/react';
import { BarPage } from '../../components/barPage/BarPage';
import { HomeShelves, useHomeShelves } from './HomeShelves';
import { isLibraryInaccessible } from './homeEmpty';
import { greeting } from './greeting';
import './home.css';

/**
 * Home — the Spotify anti-scroll surface: horizontal shelves of recommendations
 * (recently added, from your library, suggested songs). No full-library list.
 */
export function Home() {
  const shelves = useHomeShelves();

  const onRefresh = async (e: RefresherCustomEvent) => {
    await Promise.all([
      shelves.albums.refetch(),
      shelves.suggested.refetch(),
      shelves.saved.refetch(),
      shelves.recent.refetch(),
      shelves.artists.refetch(),
      shelves.jumpBackIn.refetch(),
      shelves.favorites.refetch(),
    ]);
    await e.detail.complete();
  };

  const title = greeting(new Date().getHours());
  // The greeting IS the page title: large, right under the status bar, and it
  // hands over to the compact floating bar as it scrolls away (BarPage).
  return (
    <BarPage kind="tab-root" title={title}>
      <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
        <IonRefresherContent />
      </IonRefresher>
      <div className="home__body">
        {isLibraryInaccessible(shelves) ? (
          <div className="home__no-access" data-testid="home-no-access">
            <p className="home__no-access-title cad-headline-sm">No music to show</p>
            <p className="cad-meta">
              You&apos;re signed in, but this account can&apos;t see any music. Ask your Jellyfin
              admin to grant it access to the music library.
            </p>
          </div>
        ) : (
          <HomeShelves shelves={shelves} />
        )}
      </div>
    </BarPage>
  );
}
