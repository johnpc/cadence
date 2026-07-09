import { lazy, Suspense, type ComponentType } from 'react';

/** Wrap a named page export in React.lazy (our pages are named, not default,
 * exports) and its own Suspense boundary, so route usage stays a plain
 * `<LazyPage />`. Detail/secondary pages are code-split — the initial load
 * ships only the three tab roots + player; each resolves its chunk on first
 * navigation (Ionic's page transition covers the brief gap). */
function lazyPage(load: () => Promise<Record<string, ComponentType>>, name: string): ComponentType {
  const Loaded = lazy(() => load().then((m) => ({ default: m[name] })));
  return function LazyPage() {
    return (
      <Suspense fallback={null}>
        <Loaded />
      </Suspense>
    );
  };
}

export const LikedSongsPage = lazyPage(
  () => import('./features/library/LikedSongsPage'),
  'LikedSongsPage',
);
export const Settings = lazyPage(() => import('./features/settings/Settings'), 'Settings');
export const PlaylistDetail = lazyPage(
  () => import('./features/playlists/PlaylistDetail'),
  'PlaylistDetail',
);
export const AlbumDetail = lazyPage(() => import('./features/album/AlbumDetail'), 'AlbumDetail');
export const ArtistDetail = lazyPage(
  () => import('./features/artist/ArtistDetail'),
  'ArtistDetail',
);
export const SongDetail = lazyPage(() => import('./features/song/SongDetail'), 'SongDetail');
export const GenreDetail = lazyPage(() => import('./features/genre/GenreDetail'), 'GenreDetail');
export const History = lazyPage(() => import('./features/home/History'), 'History');
