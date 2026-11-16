import { useStore } from '../../lib/store';
import { libraryViewStore, writeLibraryView } from './libraryViewStore';

/** Your Library's list/grid layout as reactive state + a toggle. */
export function useLibraryView() {
  const view = useStore(libraryViewStore);
  return { view, toggle: () => writeLibraryView(view === 'grid' ? 'list' : 'grid') };
}
