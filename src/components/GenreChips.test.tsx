import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { GenreChips } from './GenreChips';

const inRouter = (ui: ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('GenreChips', () => {
  it('renders a chip per genre that links to the genre page', () => {
    inRouter(<GenreChips genres={['Indie', 'Alternative']} />);
    expect(screen.getByText('Indie')).toHaveAttribute('href', '/genre/Indie');
    expect(screen.getByText('Alternative')).toHaveAttribute('href', '/genre/Alternative');
  });

  it('URL-encodes genre names with special characters', () => {
    inRouter(<GenreChips genres={['R&B']} />);
    expect(screen.getByText('R&B')).toHaveAttribute('href', '/genre/R%26B');
  });

  it('renders nothing without genres', () => {
    const { container } = inRouter(<GenreChips genres={[]} />);
    expect(container.querySelector('[data-testid="genre-chips"]')).toBeNull();
    const { container: c2 } = inRouter(<GenreChips genres={undefined} />);
    expect(c2.querySelector('[data-testid="genre-chips"]')).toBeNull();
  });
});
