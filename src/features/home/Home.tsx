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
    ]);
    await e.detail.complete();
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Cadence</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>
        <h1 className="home__greeting cad-h1" data-testid="home-greeting">
          {greeting(new Date().getHours())}
        </h1>
        <HomeShelves shelves={shelves} />
      </IonContent>
    </IonPage>
  );
}
