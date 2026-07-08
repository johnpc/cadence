import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchFilters } from './SearchFilters';

describe('SearchFilters', () => {
  it('marks the active filter and reports changes', async () => {
    const onChange = vi.fn();
    render(<SearchFilters filter="all" onChange={onChange} />);
    expect(screen.getByTestId('filter-all')).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('filter-songs')).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(screen.getByTestId('filter-artists'));
    expect(onChange).toHaveBeenCalledWith('artists');
  });
});
