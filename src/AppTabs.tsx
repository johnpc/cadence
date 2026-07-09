import { useEffect } from 'react';
import { Redirect, Route } from 'react-router-dom';
import { IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { home, search, library } from 'ionicons/icons';
import { Home } from './features/home/Home';
import { Search } from './features/search/Search';
import { Library } from './features/library/Library';
import { NowPlayingBar } from './features/player/NowPlayingBar';
import { DesktopSidebar } from './features/library/DesktopSidebar';
import * as L from './lazyPages';
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
        <div className="apptabs__npbar" slot="bottom">
          <NowPlayingBar />
        </div>
        <IonRouterOutlet>
          <Route exact path="/home">
            <Home />
          </Route>
          <Route exact path="/search">
            <Search />
          </Route>
          <Route exact path="/library">
            <Library />
          </Route>
          <Route exact path="/liked">
            <L.LikedSongsPage />
          </Route>
          <Route exact path="/settings">
            <L.Settings />
          </Route>
          <Route exact path="/playlist/:id">
            <L.PlaylistDetail />
          </Route>
          <Route exact path="/album/:id">
            <L.AlbumDetail />
          </Route>
          <Route exact path="/artist/:id">
            <L.ArtistDetail />
          </Route>
          <Route exact path="/song/:id">
            <L.SongDetail />
          </Route>
          <Route exact path="/genre/:name">
            <L.GenreDetail />
          </Route>
          <Route exact path="/history">
            <L.History />
          </Route>
          <Route exact path="/">
            <Redirect to="/home" />
          </Route>
        </IonRouterOutlet>
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
