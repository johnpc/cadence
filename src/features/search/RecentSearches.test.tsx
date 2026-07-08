import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RecentSearches } from './RecentSearches';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { RecentItem } from './recentSearchStore';

const recents: RecentItem[] = [
  { Id: 's', Name: 'A Song', Type: 'Audio', Artists: ['Band'] },
  { Id: 'al', Name: 'An Album', Type: 'MusicAlbum', AlbumArtist: 'Band' },
];

describe('RecentSearches', () => {
  it('shows the idle prompt when there are no recents', () => {
    renderWithProviders(<RecentSearches recents={[]} onClear={vi.fn()} />);
    expect(screen.getByTestId('search-idle')).toBeInTheDocument();
  });

  it('lists recent items and clears them', async () => {
    const onClear = vi.fn();
    renderWithProviders(<RecentSearches recents={recents} onClear={onClear} />);
    expect(screen.getByText('A Song')).toBeInTheDocument();
    expect(screen.getByText('An Album')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('clear-recents'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('plays a recent song when tapped', async () => {
    const playQueue = vi.fn();
    renderWithProviders(<RecentSearches recents={[recents[0]]} onClear={vi.fn()} />, {
      player: stubPlayer({ playQueue }),
    });
    await userEvent.click(screen.getByTestId('result-row'));
    expect(playQueue).toHaveBeenCalled();
  });
});
