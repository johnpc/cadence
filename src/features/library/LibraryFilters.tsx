import '../search/searchFilters.css';
import type { LibraryFilter } from './libraryRows';

const FILTERS: { value: LibraryFilter; label: string }[] = [
  { value: 'playlists', label: 'Playlists' },
  { value: 'albums', label: 'Albums' },
  { value: 'artists', label: 'Artists' },
];

/** The Playlists / Albums / Artists filter pills atop Your Library. */
export function LibraryFilters({
  filter,
  onChange,
}: {
  filter: LibraryFilter;
  onChange: (filter: LibraryFilter) => void;
}) {
  return (
    <div className="search-filters" role="group" aria-label="Filter library">
      {FILTERS.map((f) => (
        <button
          key={f.value}
          type="button"
          className={
            filter === f.value
              ? 'search-filters__chip search-filters__chip--on'
              : 'search-filters__chip'
          }
          aria-pressed={filter === f.value}
          data-testid={`library-filter-${f.value}`}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
