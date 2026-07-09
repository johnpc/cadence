import { useEffect } from 'react';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { home, search, library } from 'ionicons/icons';
import { NowPlayingBar } from './features/player/NowPlayingBar';
import { DesktopSidebar } from './features/library/DesktopSidebar';
import { AppTabRoutes } from './AppTabRoutes';
import './appTabs.css';

/**
 * The signed-in shell: a Spotify-style bottom tab bar over Home / Search / Your
 * Library, with a persistent mini-player and (on desktop) a left sidebar. There
 * is deliberately NO full-library scroll — discovery is driven by
 * recommendations (Home), Search, and playlists/likes (Library). Settings is
 * reachable from Your Library, not a tab. The route table lives in AppTabRoutes.
 */
export function AppTabs() {
  // Flag the shell so CSS can inset the tab pages + mini-player for the desktop
  // sidebar (a no-op on mobile, where the sidebar is hidden).
  useEffect(() => {
    document.body.classList.add('app-has-sidebar');
    return () => document.body.classList.remove('app-has-sidebar');
  }, []);

  return (
    <>
      <DesktopSidebar />
      <IonTabs>
        {/* Persistent mini-player, fixed just above the tab bar (CSS). */}
        <div className="apptabs__npbar" slot="bottom">
          <NowPlayingBar />
        </div>
        <AppTabRoutes />
        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href="/home">
            <IonIcon aria-hidden="true" icon={home} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="search" href="/search">
            <IonIcon aria-hidden="true" icon={search} />
            <IonLabel>Search</IonLabel>
          </IonTabButton>
          <IonTabButton tab="library" href="/library">
            <IonIcon aria-hidden="true" icon={library} />
            <IonLabel>Your Library</IonLabel>
          </IonTabButton>
        </IonTabBar>
      </IonTabs>
    </>
  );
}
