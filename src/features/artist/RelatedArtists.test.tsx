import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

// RelatedArtists now fetches its own data (deferred via useInView); mock the hook.
const related: { items: JellyfinItem[] } = { items: [] };
vi.mock('./artistApi', () => ({
  useRelatedArtists: () => ({ related: related.items }),
}));
import { RelatedArtists } from './RelatedArtists';

const artists: JellyfinItem[] = [
  { Id: 'a', Name: 'Artist A', Type: 'MusicArtist' },
  { Id: 'b', Name: 'Artist B', Type: 'MusicArtist' },
];

function renderRelated() {
  return render(
    <MemoryRouter initialEntries={['/artist/seed']}>
      <RelatedArtists artistId="seed" />
      <Route
        path="*"
        render={({ location }) => <span data-testid="loc">{location.pathname}</span>}
      />
    </MemoryRouter>,
  );
}

afterEach(() => {
  related.items = [];
});

describe('RelatedArtists', () => {
  it('renders only a sentinel (no section) when there are no related artists', () => {
    const { container } = renderRelated();
    expect(container.querySelector('[data-testid="artist-related"]')).toBeNull();
    expect(container.querySelector('[data-testid="artist-related-sentinel"]')).not.toBeNull();
  });

  it('shows related artists and navigates to one on click', async () => {
    related.items = artists;
    renderRelated();
    expect(screen.getByText('Fans also like')).toBeInTheDocument();
    await userEvent.click(screen.getByText('Artist B'));
    expect(screen.getByTestId('loc')).toHaveTextContent('/artist/b');
  });
});
