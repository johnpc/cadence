import { Redirect, Route } from 'react-router-dom';
import { IonRouterOutlet, IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/react';
import { home, search, library } from 'ionicons/icons';
import { Home } from './features/home/Home';
import { Search } from './features/search/Search';
import { Library } from './features/library/Library';

/**
 * The app shell: a Spotify-style bottom tab bar over Home / Search / Your
 * Library. There is deliberately NO full-library scroll — discovery is driven
 * by recommendations (Home), Search, and playlists/likes (Library).
 */
export function AppRoutes() {
  return (
    <IonTabs>
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
  );
}
