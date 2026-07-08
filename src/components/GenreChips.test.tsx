import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GenreChips } from './GenreChips';

describe('GenreChips', () => {
  it('renders a chip per genre', () => {
    render(<GenreChips genres={['Indie', 'Alternative']} />);
    expect(screen.getByText('Indie')).toBeInTheDocument();
    expect(screen.getByText('Alternative')).toBeInTheDocument();
  });

  it('renders nothing without genres', () => {
    const { container } = render(<GenreChips genres={[]} />);
    expect(container.querySelector('[data-testid="genre-chips"]')).toBeNull();
    const { container: c2 } = render(<GenreChips genres={undefined} />);
    expect(c2.querySelector('[data-testid="genre-chips"]')).toBeNull();
  });
});
