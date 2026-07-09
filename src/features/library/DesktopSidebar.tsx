import { IonIcon } from '@ionic/react';
import { home, search, library, chevronBack, chevronForward } from 'ionicons/icons';
import { NavLink } from 'react-router-dom';
import { LibraryList } from './LibraryList';
import { useSidebarCollapsed } from './useSidebarCollapsed';
import './desktopSidebar.css';

const NAV = [
  { to: '/home', icon: home, label: 'Home', testid: 'nav-home' },
  { to: '/search', icon: search, label: 'Search', testid: 'nav-search' },
  { to: '/library', icon: library, label: 'Your Library', testid: 'nav-library' },
];

/** Spotify-style persistent left sidebar, shown only at desktop widths (CSS).
 * Top: primary nav + a collapse toggle. Below: the full Your Library list.
 * Collapsed, it becomes an icons-only rail so the main area gets more room. */
export function DesktopSidebar() {
  const { collapsed, toggle } = useSidebarCollapsed();
  return (
    <aside
      className={collapsed ? 'sidebar sidebar--collapsed' : 'sidebar'}
      data-testid="desktop-sidebar"
    >
      <button
        type="button"
        className="sidebar__collapse"
        data-testid="sidebar-collapse"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        onClick={toggle}
      >
        <IonIcon icon={collapsed ? chevronForward : chevronBack} aria-hidden="true" />
      </button>
      <nav className="sidebar__nav">
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            className="sidebar__link"
            activeClassName="sidebar__link--on"
            to={n.to}
            data-testid={n.testid}
            title={n.label}
          >
            <IonIcon icon={n.icon} aria-hidden="true" />
            <span className="sidebar__label">{n.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar__library">
        <LibraryList />
      </div>
    </aside>
  );
}
