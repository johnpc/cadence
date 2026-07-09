import { Redirect, Route } from 'react-router-dom';
import { IonRouterOutlet } from '@ionic/react';
import { Home } from './features/home/Home';
import { Search } from './features/search/Search';
import { Library } from './features/library/Library';
import {
  LikedSongsPage,
  Settings,
  PlaylistDetail,
  AlbumDetail,
  ArtistDetail,
  SongDetail,
  GenreDetail,
  History,
} from './lazyPages';

/** The signed-in route table. Home/Search/Library are the eagerly-loaded tab
 * roots; every detail/secondary page is code-split (see lazyPages). */
export function AppTabRoutes() {
  return (
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
        <LikedSongsPage />
      </Route>
      <Route exact path="/settings">
        <Settings />
      </Route>
      <Route exact path="/playlist/:id">
        <PlaylistDetail />
      </Route>
      <Route exact path="/album/:id">
        <AlbumDetail />
      </Route>
      <Route exact path="/artist/:id">
        <ArtistDetail />
      </Route>
      <Route exact path="/song/:id">
        <SongDetail />
      </Route>
      <Route exact path="/genre/:name">
        <GenreDetail />
      </Route>
      <Route exact path="/history">
        <History />
      </Route>
      <Route exact path="/">
        <Redirect to="/home" />
      </Route>
    </IonRouterOutlet>
  );
}
