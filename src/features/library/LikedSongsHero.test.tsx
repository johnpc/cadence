import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LikedSongsHero } from './LikedSongsHero';

describe('LikedSongsHero', () => {
  it('shows the title and the summary it is given', () => {
    render(<LikedSongsHero summary="12 songs • 48 min" />);
    expect(screen.getByRole('heading', { name: 'Liked Songs' })).toBeInTheDocument();
    expect(screen.getByTestId('liked-summary')).toHaveTextContent('12 songs • 48 min');
  });
});
