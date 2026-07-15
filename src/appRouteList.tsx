import { Redirect, Route } from 'react-router-dom';
import { Home } from './features/home/Home';
import { Search } from './features/search/Search';
import { Library } from './features/library/Library';
import * as L from './lazyPages';

/** The signed-in route table. Returned as an array (not a wrapper component) so
 * these stay DIRECT children of IonRouterOutlet — Ionic inspects the outlet's
 * direct children to drive page transitions, so they can't be nested. Extracted
 * from AppTabs to keep that file under the line gate. The `/artist/:id/tracks`
 * route precedes `/artist/:id` so the more specific path matches first. */
export function appRouteList() {
  return [
    <Route exact path="/home" key="home">
      <Home />
    </Route>,
    <Route exact path="/search" key="search">
      <Search />
    </Route>,
    <Route exact path="/library" key="library">
      <Library />
    </Route>,
    <Route exact path="/liked" key="liked">
      <L.LikedSongsPage />
    </Route>,
    <Route exact path="/downloads" key="downloads">
      <L.DownloadsPage />
    </Route>,
    <Route exact path="/settings" key="settings">
      <L.Settings />
    </Route>,
    <Route exact path="/playlist/:id" key="playlist">
      <L.PlaylistDetail />
    </Route>,
    <Route exact path="/album/:id" key="album">
      <L.AlbumDetail />
    </Route>,
    <Route exact path="/artist/:id/tracks" key="artist-tracks">
      <L.ArtistTracksPage />
    </Route>,
    <Route exact path="/artist/:id" key="artist">
      <L.ArtistDetail />
    </Route>,
    <Route exact path="/song/:id" key="song">
      <L.SongDetail />
    </Route>,
    <Route exact path="/genre/:name" key="genre">
      <L.GenreDetail />
    </Route>,
    <Route exact path="/history" key="history">
      <L.History />
    </Route>,
    <Route exact path="/requests" key="requests">
      <L.Requests />
    </Route>,
    <Route exact path="/import/deezer" key="deezer-import">
      <L.DeezerImport />
    </Route>,
    <Route exact path="/" key="root">
      <Redirect to="/home" />
    </Route>,
    <Route key="notfound">
      <L.NotFound />
    </Route>,
  ];
}
