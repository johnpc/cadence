import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { Appearance } from '../theme/Appearance';
import { Autoplay } from './Autoplay';
import { AudioQuality } from './AudioQuality';
import { PlaybackSpeed } from './PlaybackSpeed';
import { SleepTimer } from './SleepTimer';
import { InstallButton } from './InstallButton';
import { SignOutButton } from './SignOutButton';
import { ClearCacheButton } from './ClearCacheButton';
import { useAuth } from '../auth/useAuth';
import './settings.css';

const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0';

/** Settings — theme choice, the signed-in account, sign-out, and app info. */
export function Settings() {
  const { username } = useAuth();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/library" />
          </IonButtons>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 className="cad-sr-only">Settings</h1>
        <div className="settings">
          <Appearance />
          <Autoplay />
          <AudioQuality />
          <PlaybackSpeed />
          <SleepTimer />
          <InstallButton />
          <section className="settings__storage">
            <h2 className="settings__title cad-kicker">Storage</h2>
            <p className="cad-meta">
              Reload everything from your Jellyfin server if something looks stale or out of date.
            </p>
            <ClearCacheButton />
          </section>
          <section className="settings__account">
            <h2 className="settings__title cad-kicker">Account</h2>
            <p className="cad-body" data-testid="settings-username">
              Signed in as {username}
            </p>
            <SignOutButton />
          </section>
          <section className="settings__about">
            <h2 className="settings__title cad-kicker">About</h2>
            <p className="cad-meta" data-testid="settings-version">
              Cadence v{APP_VERSION}
            </p>
          </section>
        </div>
      </IonContent>
    </IonPage>
  );
}
