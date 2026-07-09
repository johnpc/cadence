import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FullPlayerTitle } from './FullPlayerTitle';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

vi.mock('../library/useLikeToggle', () => ({
  useLikeToggle: () => ({ liked: false, toggle: vi.fn(), busy: false }),
}));

const song: JellyfinItem = { Id: 's1', Name: 'A Song', Type: 'Audio', Artists: ['Band'] };
const withArtists: JellyfinItem = {
  ...song,
  ArtistItems: [
    { Id: 'ar1', Name: 'First' },
    { Id: 'ar2', Name: 'Second' },
  ],
};

describe('FullPlayerTitle', () => {
  it('links the title to the song page', () => {
    renderWithProviders(<FullPlayerTitle track={song} onNavigate={vi.fn()} />);
    expect(screen.getByTestId('full-player-song-link')).toHaveAttribute('href', '/song/s1');
    expect(screen.getByText('A Song')).toBeInTheDocument();
  });

  it('links each artist to its artist page', () => {
    renderWithProviders(<FullPlayerTitle track={withArtists} onNavigate={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'First' })).toHaveAttribute('href', '/artist/ar1');
    expect(screen.getByRole('link', { name: 'Second' })).toHaveAttribute('href', '/artist/ar2');
  });

  it('falls back to a plain artist line when no artist ids are present', () => {
    renderWithProviders(<FullPlayerTitle track={song} onNavigate={vi.fn()} />);
    const line = screen.getByTestId('full-player-artists');
    expect(line).toHaveTextContent('Band');
    expect(line.querySelector('a')).toBeNull();
  });

  it('renders no link when there is no current track', () => {
    renderWithProviders(<FullPlayerTitle track={null} onNavigate={vi.fn()} />);
    expect(screen.queryByTestId('full-player-song-link')).not.toBeInTheDocument();
  });
});
