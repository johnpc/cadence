/** Persistence + default for the library's list-vs-grid view (localStorage,
 * per-device). List by default (Spotify's default); users can switch to a grid
 * of cover tiles. Listener-based so the toggle + list stay in sync in one tab. */
const VIEW_KEY = 'cadence.library.view';
export type LibraryView = 'list' | 'grid';

const listeners = new Set<(v: LibraryView) => void>();

export function readLibraryView(): LibraryView {
  return localStorage.getItem(VIEW_KEY) === 'grid' ? 'grid' : 'list';
}

export function writeLibraryView(view: LibraryView): void {
  localStorage.setItem(VIEW_KEY, view);
  listeners.forEach((l) => l(view));
}

export function onLibraryViewChange(listener: (v: LibraryView) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
