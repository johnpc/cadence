import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/jellyfinArtists', () => ({ getFavoriteArtists: vi.fn() }));
import { getFavoriteArtists } from '../../lib/jellyfinArtists';
import { FollowedArtists } from './FollowedArtists';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const artists: JellyfinItem[] = [
  { Id: 'ar1', Name: 'First Band', Type: 'MusicArtist' },
  { Id: 'ar2', Name: 'Second Band', Type: 'MusicArtist' },
];

describe('FollowedArtists', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders followed artists linking to their detail pages', async () => {
    vi.mocked(getFavoriteArtists).mockResolvedValue(artists);
    renderWithProviders(<FollowedArtists />);
    await waitFor(() => expect(screen.getByText('First Band')).toBeInTheDocument());
    expect(screen.getAllByTestId('followed-artist-row')[0]).toHaveAttribute('href', '/artist/ar1');
  });

  it('shows an empty state when nothing is followed', async () => {
    vi.mocked(getFavoriteArtists).mockResolvedValue([]);
    renderWithProviders(<FollowedArtists />);
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });
});
