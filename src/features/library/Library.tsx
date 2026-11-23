import { IonButton, IonIcon } from '@ionic/react';
import { BarPage } from '../../components/barPage/BarPage';
import { settingsOutline, cloudDownloadOutline } from 'ionicons/icons';
import { LibraryList } from './LibraryList';
import { isExtensionEnabled } from '../../extensions/flags';

/** Your Library — one filterable list (Playlists / Albums / Artists), with
 * Liked Songs pinned as the first playlist. Requesting music now has its own
 * bottom tab (see AppTabs), so there's no request entry point here. "Import from
 * Deezer" appears only when the CadenceConfig plugin exposes the import endpoint. */
export function Library() {
  return (
    <BarPage
      kind="tab-root"
      title="Your Library"
      end={
        <>
          {isExtensionEnabled('deezerImport') && (
            <IonButton routerLink="/import/deezer" data-testid="library-import-deezer">
              <IonIcon
                slot="icon-only"
                icon={cloudDownloadOutline}
                aria-label="Import from Deezer"
              />
            </IonButton>
          )}
          <IonButton routerLink="/settings" data-testid="library-settings">
            <IonIcon slot="icon-only" icon={settingsOutline} aria-label="Settings" />
          </IonButton>
        </>
      }
    >
      <LibraryList />
    </BarPage>
  );
}
