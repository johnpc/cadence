import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FullPlayerTitle } from './FullPlayerTitle';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

vi.mock('../library/useLikeToggle', () => ({
  useLikeToggle: () => ({ liked: false, toggle: vi.fn(), busy: false }),
}));

const song: JellyfinItem = { Id: 's1', Name: 'A Song', Type: 'Audio', Artists: ['Band'] };

describe('FullPlayerTitle', () => {
  it('links the title to the song page', () => {
    renderWithProviders(<FullPlayerTitle track={song} onNavigate={vi.fn()} />);
    expect(screen.getByTestId('full-player-song-link')).toHaveAttribute('href', '/song/s1');
    expect(screen.getByText('A Song')).toBeInTheDocument();
  });

  it('renders no link when there is no current track', () => {
    renderWithProviders(<FullPlayerTitle track={null} onNavigate={vi.fn()} />);
    expect(screen.queryByTestId('full-player-song-link')).not.toBeInTheDocument();
  });
});
