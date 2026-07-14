import { IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { home, search, library, addCircleOutline } from 'ionicons/icons';
import { lidarrProxyEnabled } from './lib/runtimeConfig';
import { NowPlayingBar } from './features/player/NowPlayingBar';
import { NowPlayingAnnouncer } from './features/player/NowPlayingAnnouncer';
import { DesktopSidebar } from './features/library/DesktopSidebar';
import { OfflineBanner } from './features/shell/OfflineBanner';
import { KeyboardShortcutsHelp } from './features/shell/KeyboardShortcutsHelp';
import { useShellChrome } from './features/shell/useShellChrome';
import { useScrollToTopOnRetap } from './features/shell/useScrollToTopOnRetap';
import { appRouteList } from './appRouteList';
import './appTabs.css';

/**
 * The signed-in shell: a Spotify-style bottom tab bar over Home / Search / Your
 * Library, a persistent mini-player, and (on desktop) a left sidebar. There is
 * deliberately NO full-library scroll — discovery is driven by recommendations
 * (Home), Search, and playlists/likes (Library). Settings is reachable from Your
 * Library, not a tab. Detail pages are code-split (lazyPages). IonRouterOutlet
 * MUST be a direct child of IonTabs (Ionic inspects its direct children).
 */
export function AppTabs() {
  // body sidebar class + "/" search hotkey + "?" shortcuts-help overlay state
  const { helpOpen, setHelpOpen } = useShellChrome();
  // Re-tapping the active tab scrolls that view to the top (iOS/Spotify).
  const retap = useScrollToTopOnRetap();
  // The Requests tab only appears where the Lidarr proxy is deployed (web); it
  // can't function without it (e.g. native has no config.js → hidden there).
  const canRequest = lidarrProxyEnabled();
  return (
    <>
      <OfflineBanner />
      <NowPlayingAnnouncer />
      <KeyboardShortcutsHelp open={helpOpen} onClose={() => setHelpOpen(false)} />
      <DesktopSidebar />
      <IonTabs>
        <div className="apptabs__npbar" slot="bottom">
          <NowPlayingBar />
        </div>
        <IonRouterOutlet>{appRouteList()}</IonRouterOutlet>
        <IonTabBar slot="bottom">
          <IonTabButton tab="home" href="/home" onClick={retap('/home')}>
            <IonIcon aria-hidden="true" icon={home} />
            <IonLabel>Home</IonLabel>
          </IonTabButton>
          <IonTabButton tab="search" href="/search" onClick={retap('/search')}>
            <IonIcon aria-hidden="true" icon={search} />
            <IonLabel>Search</IonLabel>
          </IonTabButton>
          <IonTabButton tab="library" href="/library" onClick={retap('/library')}>
            <IonIcon aria-hidden="true" icon={library} />
            <IonLabel>Your Library</IonLabel>
          </IonTabButton>
          {canRequest && (
            <IonTabButton tab="requests" href="/requests" onClick={retap('/requests')}>
              <IonIcon aria-hidden="true" icon={addCircleOutline} />
              <IonLabel>Requests</IonLabel>
            </IonTabButton>
          )}
        </IonTabBar>
      </IonTabs>
    </>
  );
}
