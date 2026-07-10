import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useDownloads', () => ({ useDownloads: vi.fn() }));
// TrackRow's own download button drives the store; stub it so this test focuses
// on the screen (its list + empty state), not the button internals.
vi.mock('./DownloadButton', () => ({ DownloadButton: () => null }));
import { useDownloads } from './useDownloads';
import { Downloads } from './Downloads';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks: JellyfinItem[] = [
  { Id: 'a', Name: 'First Down', Type: 'Audio' },
  { Id: 'b', Name: 'Second Down', Type: 'Audio' },
];

describe('Downloads', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('lists the downloaded tracks', () => {
    vi.mocked(useDownloads).mockReturnValue({ tracks });
    renderWithProviders(<Downloads />);
    expect(screen.getByTestId('downloads')).toBeInTheDocument();
    expect(screen.getByText('First Down')).toBeInTheDocument();
    expect(screen.getByText('Second Down')).toBeInTheDocument();
  });

  it('shows the empty state when nothing is downloaded', () => {
    vi.mocked(useDownloads).mockReturnValue({ tracks: [] });
    renderWithProviders(<Downloads />);
    expect(screen.getByTestId('load-empty')).toBeInTheDocument();
    expect(screen.getByText('No downloads yet')).toBeInTheDocument();
  });
});
