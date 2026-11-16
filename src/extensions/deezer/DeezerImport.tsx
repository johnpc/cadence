import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { DeezerImportForm } from './DeezerImportForm';
import { DeezerImportResult } from './DeezerImportResult';
import { useDeezerImport } from './useDeezerImport';
import './deezer.css';

/** "Import from Deezer" — paste a public Deezer playlist link to recreate it as a
 * Jellyfin playlist: the tracks already in the library are added, and the artists
 * that aren't can be requested via Lidarr. Only routed when the CadenceConfig
 * plugin advertises the Deezer import endpoint (see AppRoutes). */
export function DeezerImport() {
  const { importing, result, status, runImport, request } = useDeezerImport();
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/library" />
          </IonButtons>
          <IonTitle>Import from Deezer</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <h1 className="cad-sr-only">Import from Deezer</h1>
        <p className="cad-meta deezer-intro">
          Recreate a public Deezer playlist here. Tracks already in the library are added instantly;
          anything missing can be requested so it downloads into the library.
        </p>
        <DeezerImportForm importing={importing} onImport={runImport} />
        {result && <DeezerImportResult result={result} status={status} onRequest={request} />}
      </IonContent>
    </IonPage>
  );
}
