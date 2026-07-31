import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Ionic form controls don't render usable inputs in jsdom — replace them with
// plain elements that forward the events we assert on (see the Settings/Lyrics
// test gotcha in CLAUDE.md).
vi.mock('@ionic/react', () => ({
  IonSearchbar: ({
    onIonInput,
    ...rest
  }: {
    onIonInput?: (e: { detail: { value: string } }) => void;
    [k: string]: unknown;
  }) => (
    <input
      {...(rest as Record<string, unknown>)}
      onChange={(e) => onIonInput?.({ detail: { value: e.target.value } })}
    />
  ),
  IonSelect: ({ value, ...rest }: { value?: string; [k: string]: unknown }) => (
    <select {...(rest as Record<string, unknown>)} value={value} onChange={() => {}} />
  ),
  IonSelectOption: ({ children, value }: { children: React.ReactNode; value: string }) => (
    <option value={value}>{children}</option>
  ),
}));
import { AudiobookControls } from './AudiobookControls';

describe('AudiobookControls', () => {
  it('reports search input changes', () => {
    const onQuery = vi.fn();
    render(<AudiobookControls query="" onQuery={onQuery} sort="alpha" onSort={vi.fn()} />);
    fireEvent.change(screen.getByTestId('audiobook-search'), { target: { value: 'dune' } });
    expect(onQuery).toHaveBeenCalledWith('dune');
  });

  it('renders the sort selector seeded with the current sort and all options', () => {
    render(<AudiobookControls query="" onQuery={vi.fn()} sort="added" onSort={vi.fn()} />);
    const sel = screen.getByTestId('audiobook-sort') as HTMLSelectElement;
    expect(sel.value).toBe('added');
    expect(screen.getByText('A–Z')).toBeInTheDocument();
    expect(screen.getByText('Recently played')).toBeInTheDocument();
  });
});
