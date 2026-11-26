import '../search/searchFilters.css';
import type { BookFilter } from './bookFilterStore';

const FILTERS: { value: BookFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'readalong', label: 'Read along' },
];

/** The All / Read along pills atop the Books tab (same chips as Your Library). */
export function BookFilterChips({
  filter,
  onChange,
}: {
  filter: BookFilter;
  onChange: (filter: BookFilter) => void;
}) {
  return (
    <div className="search-filters" role="group" aria-label="Filter books">
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
          data-testid={`book-filter-${f.value}`}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
