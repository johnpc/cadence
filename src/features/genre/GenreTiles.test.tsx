import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { GenreTiles } from './GenreTiles';
import { GENRES } from './genres';

function renderTiles() {
  return render(
    <MemoryRouter initialEntries={['/search']}>
      <GenreTiles />
      <Route
        path="*"
        render={({ location }) => <span data-testid="loc">{location.pathname}</span>}
      />
    </MemoryRouter>,
  );
}

describe('GenreTiles', () => {
  it('renders a tile for every curated genre', () => {
    renderTiles();
    expect(screen.getAllByTestId('genre-tile')).toHaveLength(GENRES.length);
    expect(screen.getByText('Browse all')).toBeInTheDocument();
  });

  it('navigates to the genre page (URL-encoded) on click', async () => {
    renderTiles();
    await userEvent.click(screen.getByText('Hip-Hop'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/genre/Hip-Hop');
  });
});
