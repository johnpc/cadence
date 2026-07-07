import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Search } from './Search';

describe('Search', () => {
  it('renders the search placeholder', () => {
    render(<Search />);
    expect(screen.getByTestId('search-placeholder')).toBeInTheDocument();
  });
});
