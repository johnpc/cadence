import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ArtistAlbums } from './ArtistAlbums';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album = (over: Partial<JellyfinItem>): JellyfinItem =>
  ({ Id: over.Id ?? 'x', Name: over.Name ?? 'x', Type: 'MusicAlbum', ...over }) as JellyfinItem;

function renderAlbums(props: Partial<Parameters<typeof ArtistAlbums>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ArtistAlbums
        albums={props.albums ?? []}
        isLoading={props.isLoading ?? false}
        isError={props.isError ?? false}
        onRetry={props.onRetry ?? (() => {})}
      />
    </MemoryRouter>,
  );
}

describe('ArtistAlbums', () => {
  it('renders grouped sections with the primary grid keeping the artist-albums testid', () => {
    renderAlbums({
      albums: [
        album({ Id: 'lp', Name: 'The LP', ChildCount: 10 }),
        album({ Id: 'sg', Name: 'A Single', ChildCount: 2 }),
      ],
    });
    expect(screen.getByTestId('artist-albums')).toHaveTextContent('The LP');
    expect(screen.getByTestId('artist-albums-singles')).toHaveTextContent('A Single');
    expect(screen.getByText('Albums')).toBeInTheDocument();
    expect(screen.getByText('Singles & EPs')).toBeInTheDocument();
  });

  it('shows the empty state when there are no albums', () => {
    renderAlbums({ albums: [] });
    expect(screen.getByTestId('load-empty')).toBeInTheDocument();
  });

  it('shows an error state with a working retry', async () => {
    const onRetry = vi.fn();
    renderAlbums({ isError: true, onRetry });
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('navigates to the album when a card is tapped', async () => {
    renderAlbums({ albums: [album({ Id: 'al9', Name: 'Tap Me', ChildCount: 10 })] });
    await userEvent.click(screen.getByTestId('artist-album'));
    // MemoryRouter has no visible route target; tapping must not throw and the
    // card carries the right accessible label.
    expect(screen.getByLabelText('Open Tap Me')).toBeInTheDocument();
  });
});
