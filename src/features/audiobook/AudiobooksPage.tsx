import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { Audiobooks } from './Audiobooks';

/** The audiobook library as its own page (reached from Your Library). */
export function AudiobooksPage() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/library" />
          </IonButtons>
          <IonTitle>Audiobooks</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <Audiobooks />
      </IonContent>
    </IonPage>
  );
}
