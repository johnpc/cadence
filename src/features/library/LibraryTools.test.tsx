import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LibraryTools } from './LibraryTools';

function renderTools(over: Partial<Parameters<typeof LibraryTools>[0]> = {}) {
  const props = {
    query: '',
    onQuery: vi.fn(),
    sort: 'recents' as const,
    onSort: vi.fn(),
    view: 'list' as const,
    onToggleView: vi.fn(),
    ...over,
  };
  render(<LibraryTools {...props} />);
  return props;
}

describe('LibraryTools', () => {
  it('toggles the view when the view button is tapped', async () => {
    const p = renderTools();
    await userEvent.click(screen.getByTestId('library-view'));
    expect(p.onToggleView).toHaveBeenCalledOnce();
  });

  it('labels the view button by the view it switches TO', () => {
    const { rerender } = render(
      <LibraryTools
        query=""
        onQuery={() => {}}
        sort="recents"
        onSort={() => {}}
        view="list"
        onToggleView={() => {}}
      />,
    );
    expect(screen.getByTestId('library-view')).toHaveAttribute('aria-label', 'Switch to grid view');
    rerender(
      <LibraryTools
        query=""
        onQuery={() => {}}
        sort="recents"
        onSort={() => {}}
        view="grid"
        onToggleView={() => {}}
      />,
    );
    expect(screen.getByTestId('library-view')).toHaveAttribute('aria-label', 'Switch to list view');
  });

  it('exposes the active sort as a data attribute for the dropdown control', () => {
    renderTools({ sort: 'added' });
    expect(screen.getByTestId('library-sort')).toHaveAttribute('data-sort', 'added');
  });
});
