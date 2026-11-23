import {
  IonContent,
  IonHeader,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  type RefresherCustomEvent,
} from '@ionic/react';
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
  // iOS large-title pattern: the greeting IS the page title. It sits large at the
  // top of the content and condenses into the (translucent) toolbar on scroll,
  // instead of a fixed "Cadence" bar stacked over a second big greeting that
  // sliced section headings in half as they scrolled under it.
  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar>
          <IonTitle>{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        <IonHeader collapse="condense">
          <IonToolbar>
            <IonTitle size="large">
              <h1 className="home__greeting" data-testid="home-greeting">
                {title}
              </h1>
            </IonTitle>
          </IonToolbar>
        </IonHeader>
        <div className="ion-padding home__body">
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
      </IonContent>
    </IonPage>
  );
}
