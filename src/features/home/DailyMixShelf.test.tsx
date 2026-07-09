import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

const playItem = vi.fn();
vi.mock('../player/usePlayItem', () => ({ usePlayItem: () => playItem }));
import { DailyMixShelf } from './DailyMixShelf';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const artists: JellyfinItem[] = [
  { Id: 'a1', Name: 'Radiohead', Type: 'MusicArtist' },
  { Id: 'a2', Name: 'Muse', Type: 'MusicArtist' },
];

function renderShelf(items: JellyfinItem[]) {
  return render(
    <MemoryRouter initialEntries={['/home']}>
      <DailyMixShelf artists={items} />
      <Route
        path="*"
        render={({ location }) => <span data-testid="loc">{location.pathname}</span>}
      />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
});

describe('DailyMixShelf', () => {
  it('renders a "<Artist> Mix" card per followed artist', () => {
    renderShelf(artists);
    expect(screen.getByText('Made for you')).toBeInTheDocument();
    expect(screen.getByText('Radiohead Mix')).toBeInTheDocument();
    expect(screen.getByText('Muse Mix')).toBeInTheDocument();
    expect(screen.getAllByTestId('daily-mix')).toHaveLength(2);
  });

  it('opens the seed artist page when the card body is tapped', async () => {
    renderShelf(artists);
    await userEvent.click(screen.getAllByTestId('daily-mix-hit')[0]);
    expect(screen.getByTestId('loc')).toHaveTextContent('/artist/a1');
    expect(playItem).not.toHaveBeenCalled();
  });

  it('starts the artist radio via the play FAB', async () => {
    renderShelf(artists);
    await userEvent.click(screen.getAllByTestId('daily-mix-play')[0]);
    expect(playItem).toHaveBeenCalledWith(artists[0]);
  });

  it('renders nothing when the user follows no artists', () => {
    const { container } = renderShelf([]);
    expect(container.querySelector('[data-testid="shelf"]')).toBeNull();
  });
});
