import { render, screen } from '@testing-library/react';
import { heart } from 'ionicons/icons';
import { describe, expect, it } from 'vitest';
import { CollectionHero } from './CollectionHero';

describe('CollectionHero', () => {
  it('shows the title and summary', () => {
    render(<CollectionHero icon={heart} title="Liked Songs" summary="12 songs" variant="liked" />);
    expect(screen.getByRole('heading', { name: 'Liked Songs' })).toBeInTheDocument();
    expect(screen.getByTestId('collection-hero-summary')).toHaveTextContent('12 songs');
  });

  it('applies the variant class for its gradient palette', () => {
    render(<CollectionHero icon={heart} title="Downloads" summary="3 songs" variant="downloads" />);
    expect(screen.getByTestId('collection-hero')).toHaveClass('coll-hero--downloads');
  });
});
