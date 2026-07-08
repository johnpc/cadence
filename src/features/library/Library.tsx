import {
  IonButtons,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { settingsOutline } from 'ionicons/icons';
import { LikedSongs } from './LikedSongs';
import { SavedAlbums } from './SavedAlbums';
import { Playlists } from '../playlists/Playlists';

/** Your Library — liked songs, saved albums, and playlists. */
export function Library() {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Your Library</IonTitle>
          <IonButtons slot="end">
            <IonButton routerLink="/settings" data-testid="library-settings">
              <IonIcon slot="icon-only" icon={settingsOutline} aria-label="Settings" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <LikedSongs />
        <SavedAlbums />
        <Playlists />
      </IonContent>
    </IonPage>
  );
}
