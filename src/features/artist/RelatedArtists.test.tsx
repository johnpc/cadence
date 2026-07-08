import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { RelatedArtists } from './RelatedArtists';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const artists: JellyfinItem[] = [
  { Id: 'a', Name: 'Artist A', Type: 'MusicArtist' },
  { Id: 'b', Name: 'Artist B', Type: 'MusicArtist' },
];

function renderRelated(items: JellyfinItem[]) {
  return render(
    <MemoryRouter initialEntries={['/artist/seed']}>
      <RelatedArtists artists={items} />
      <Route
        path="*"
        render={({ location }) => <span data-testid="loc">{location.pathname}</span>}
      />
    </MemoryRouter>,
  );
}

describe('RelatedArtists', () => {
  it('renders nothing when there are no related artists', () => {
    const { container } = renderRelated([]);
    expect(container.querySelector('[data-testid="artist-related"]')).toBeNull();
  });

  it('shows related artists and navigates to one on click', async () => {
    renderRelated(artists);
    expect(screen.getByText('Fans also like')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Artist B'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/artist/b');
  });
});
