/** A human page name for a pathname, spoken by the route announcer on
 * navigation so screen-reader users hear where they landed (SPA route changes
 * are otherwise silent). Detail routes (/album/:id) can't name the item from
 * the URL alone, so they announce the kind ("Album"); the tab/list routes get
 * their proper names. */
export function routeLabel(pathname: string): string {
  const seg = pathname.replace(/^\/+/, '').split('/')[0] || 'home';
  const NAMED: Record<string, string> = {
    home: 'Home',
    search: 'Search',
    library: 'Your Library',
    liked: 'Liked Songs',
    settings: 'Settings',
    history: 'Recently played',
    album: 'Album',
    artist: 'Artist',
    playlist: 'Playlist',
    song: 'Song',
    genre: 'Genre',
  };
  return NAMED[seg] ?? 'Cadence';
}
