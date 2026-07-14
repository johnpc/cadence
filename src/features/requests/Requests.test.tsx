import { screen, waitFor, act } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./lidarrApi', () => ({
  searchArtists: vi.fn(),
  getAddDefaults: vi.fn(),
  requestArtist: vi.fn(),
  getLibraryArtistIds: vi.fn().mockResolvedValue(new Set<string>()),
}));
vi.mock('../toast/useToast', () => ({ useToast: () => vi.fn() }));
import { searchArtists } from './lidarrApi';
import { Requests } from './Requests';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { LidarrArtist } from './lidarrTypes';

const artist: LidarrArtist = { artistName: 'Radiohead', foreignArtistId: 'mb-1' };

function typeSearch(value: string) {
  const bar = screen.getByTestId('requests-search');
  act(() => {
    bar.dispatchEvent(new CustomEvent('ionInput', { detail: { value } }));
  });
}

afterEach(() => {
  vi.resetAllMocks();
});

describe('Requests', () => {
  it('searches and lists artist results to request', async () => {
    vi.mocked(searchArtists).mockResolvedValue([artist]);
    renderWithProviders(<Requests />);
    expect(screen.getByTestId('requests-search')).toBeInTheDocument();
    typeSearch('radiohead');
    await waitFor(() => expect(screen.getByText('Radiohead')).toBeInTheDocument());
    expect(screen.getByTestId('request-button')).toBeInTheDocument();
  });

  it('shows an empty state when the search finds nothing', async () => {
    vi.mocked(searchArtists).mockResolvedValue([]);
    renderWithProviders(<Requests />);
    typeSearch('zznope');
    await waitFor(() => expect(screen.getByTestId('load-empty')).toBeInTheDocument());
  });

  it('pre-fills the search from a ?q= param (the Search "request this" bridge)', async () => {
    vi.mocked(searchArtists).mockResolvedValue([artist]);
    renderWithProviders(<Requests />, { route: '/requests?q=radiohead' });
    await waitFor(() => expect(searchArtists).toHaveBeenCalledWith('radiohead'));
    expect(await screen.findByText('Radiohead')).toBeInTheDocument();
  });
});
