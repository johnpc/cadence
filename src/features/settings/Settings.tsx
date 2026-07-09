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
import { SleepTimer } from './SleepTimer';
import { InstallButton } from './InstallButton';
import { SignOutButton } from './SignOutButton';
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
        <div className="settings">
          <Appearance />
          <SleepTimer />
          <InstallButton />
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
