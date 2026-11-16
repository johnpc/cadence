import { createStoredValue } from '../../lib/store';

/** Your Library's layout preference (localStorage, per-device): a list or a
 * grid of covers. List by default. */
export type LibraryView = 'list' | 'grid';

export const libraryViewStore = createStoredValue<LibraryView>({
  key: 'cadence.library.view',
  parse: (raw) => (raw === 'grid' ? 'grid' : 'list'),
  serialize: (view) => view,
});

export const readLibraryView = (): LibraryView => libraryViewStore.get();
export const writeLibraryView = (view: LibraryView): void => libraryViewStore.set(view);
export const onLibraryViewChange = (listener: (v: LibraryView) => void): (() => void) =>
  libraryViewStore.subscribe(() => listener(libraryViewStore.get()));
