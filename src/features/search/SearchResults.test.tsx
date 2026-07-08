import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchResults } from './SearchResults';
import { groupResults } from './searchGroups';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const items: JellyfinItem[] = [
  { Id: 's', Name: 'Found Song', Type: 'Audio', Artists: ['X'] },
  { Id: 'al', Name: 'Found Album', Type: 'MusicAlbum' },
];

describe('SearchResults', () => {
  it('renders grouped songs and albums with the "all" filter', () => {
    renderWithProviders(
      <SearchResults groups={groupResults(items)} filter="all" onPick={vi.fn()} />,
    );
    expect(screen.getByText('Found Song')).toBeInTheDocument();
    expect(screen.getByText('Found Album')).toBeInTheDocument();
  });

  it('narrows to only songs when filtered', () => {
    renderWithProviders(
      <SearchResults groups={groupResults(items)} filter="songs" onPick={vi.fn()} />,
    );
    expect(screen.getByText('Found Song')).toBeInTheDocument();
    expect(screen.queryByText('Found Album')).not.toBeInTheDocument();
  });

  it('records a tap as recent when a song is played', async () => {
    const onPick = vi.fn();
    renderWithProviders(
      <SearchResults groups={groupResults(items)} filter="all" onPick={onPick} />,
      { player: stubPlayer({ playQueue: vi.fn() }) },
    );
    await userEvent.click(screen.getByTestId('track-row-play'));
    expect(onPick).toHaveBeenCalledWith(items[0]);
  });
});
