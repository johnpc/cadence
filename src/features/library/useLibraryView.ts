import { useEffect, useState } from 'react';
import { readLibraryView, writeLibraryView, onLibraryViewChange } from './libraryViewStore';

/** The library list-vs-grid view as reactive state + a toggle. */
export function useLibraryView() {
  const [view, setView] = useState(readLibraryView);
  useEffect(() => onLibraryViewChange(setView), []);
  return {
    view,
    toggle: () => writeLibraryView(view === 'grid' ? 'list' : 'grid'),
  };
}
