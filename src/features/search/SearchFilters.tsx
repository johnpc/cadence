import './searchFilters.css';

export type SearchFilter = 'all' | 'songs' | 'albums' | 'artists';

const FILTERS: { value: SearchFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'songs', label: 'Songs' },
  { value: 'albums', label: 'Albums' },
  { value: 'artists', label: 'Artists' },
];

/** The All / Songs / Albums / Artists filter chips above search results. */
export function SearchFilters({
  filter,
  onChange,
}: {
  filter: SearchFilter;
  onChange: (filter: SearchFilter) => void;
}) {
  return (
    <div className="search-filters" role="group" aria-label="Filter results">
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
          data-testid={`filter-${f.value}`}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
