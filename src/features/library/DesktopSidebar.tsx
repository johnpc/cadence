import { IonIcon } from '@ionic/react';
import { home, search, library } from 'ionicons/icons';
import { NavLink } from 'react-router-dom';
import { LibraryList } from './LibraryList';
import './desktopSidebar.css';

const NAV = [
  { to: '/home', icon: home, label: 'Home', testid: 'nav-home' },
  { to: '/search', icon: search, label: 'Search', testid: 'nav-search' },
  { to: '/library', icon: library, label: 'Your Library', testid: 'nav-library' },
];

/** Spotify-style persistent left sidebar, shown only at desktop widths (CSS).
 * Top: primary nav. Below: the full Your Library list (filter pills + rows) so
 * playlists/albums/artists are always one click away. */
export function DesktopSidebar() {
  return (
    <aside className="sidebar" data-testid="desktop-sidebar">
      <nav className="sidebar__nav">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            className="sidebar__link"
            activeClassName="sidebar__link--on"
            to={n.to}
            data-testid={n.testid}
          >
            <IonIcon icon={n.icon} aria-hidden="true" />
            <span>{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__library">
        <LibraryList />
      </div>
    </aside>
  );
}
