import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

const push = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useHistory: () => ({ push }) };
});
import { OfflineTile } from './OfflineTile';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { OfflineGroup } from './offlineGroups';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const group: OfflineGroup = {
  id: 'al1',
  title: 'Dune',
  subtitle: '2 songs',
  tracks: [{ Id: 'a', Name: 'A', Type: 'Audio' } as JellyfinItem],
  art: { Id: 'a' } as JellyfinItem,
  round: false,
};

describe('OfflineTile', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('shows the group title and subtitle', () => {
    renderWithProviders(<OfflineTile group={group} kind="album" />, { player: stubPlayer() });
    expect(screen.getByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('2 songs')).toBeInTheDocument();
  });

  it('plays the group when the play FAB is tapped', async () => {
    const playQueue = vi.fn();
    renderWithProviders(<OfflineTile group={group} kind="album" />, {
      player: stubPlayer({ playQueue }),
    });
    await userEvent.click(screen.getByLabelText('Play Dune'));
    expect(playQueue).toHaveBeenCalledWith(group.tracks, 0);
  });

  it('opens the group detail route (encoding the id) when the body is tapped', async () => {
    renderWithProviders(<OfflineTile group={{ ...group, id: 'a b' }} kind="album" />, {
      player: stubPlayer(),
    });
    await userEvent.click(screen.getByLabelText('Open Dune'));
    // encodeURIComponent turns the space into %20 in the pushed path.
    expect(push).toHaveBeenCalledWith('/offline/album/a%20b');
  });

  it('renders a round tile for an artist group', () => {
    renderWithProviders(<OfflineTile group={{ ...group, round: true }} kind="artist" />, {
      player: stubPlayer(),
    });
    expect(screen.getByTestId('offline-tile')).toHaveClass('album-card--round');
  });
});
