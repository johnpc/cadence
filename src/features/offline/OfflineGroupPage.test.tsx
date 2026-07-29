import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useOfflineGroup', () => ({ useOfflineGroup: vi.fn() }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useParams: () => ({ kind: 'album', id: 'al1' }) };
});
import { useOfflineGroup } from './useOfflineGroup';
import { OfflineGroupPage } from './OfflineGroupPage';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

describe('OfflineGroupPage', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders the group title and its tracks', () => {
    vi.mocked(useOfflineGroup).mockReturnValue({
      title: 'Dune',
      tracks: [{ Id: 'a', Name: 'Track A', Type: 'Audio' } as JellyfinItem],
    });
    renderWithProviders(<OfflineGroupPage />, { player: stubPlayer() });
    expect(screen.getByTestId('offline-group')).toBeInTheDocument();
    expect(screen.getByText('Track A')).toBeInTheDocument();
  });

  it('shows an empty state when the group is gone', () => {
    vi.mocked(useOfflineGroup).mockReturnValue(null);
    renderWithProviders(<OfflineGroupPage />, { player: stubPlayer() });
    expect(screen.getByText('Not available offline')).toBeInTheDocument();
  });
});
