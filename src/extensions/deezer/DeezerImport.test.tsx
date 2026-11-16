import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const hook = {
  importing: false,
  result: null as unknown,
  status: {} as Record<string, string>,
  runImport: vi.fn(),
  request: vi.fn(),
};
vi.mock('./useDeezerImport', () => ({ useDeezerImport: () => hook }));

import { DeezerImport } from './DeezerImport';
import { renderWithProviders } from '../../test/renderWithProviders';

afterEach(() => {
  hook.result = null;
  vi.clearAllMocks();
});

describe('DeezerImport', () => {
  it('shows the paste form (with the Spotify help link) and no result yet', () => {
    renderWithProviders(<DeezerImport />);
    expect(screen.getByTestId('deezer-url')).toBeInTheDocument();
    expect(screen.getByTestId('deezer-spotify-help')).toBeInTheDocument();
    expect(screen.queryByTestId('deezer-result')).not.toBeInTheDocument();
  });

  it('shows the result once an import has run', () => {
    hook.result = {
      PlaylistId: 'pl1',
      PlaylistName: 'En mode 60',
      AddedCount: 4,
      TotalCount: 50,
      MissingArtists: ['The Beatles'],
    };
    renderWithProviders(<DeezerImport />);
    expect(screen.getByTestId('deezer-result')).toBeInTheDocument();
    expect(screen.getByTestId('deezer-missing-row')).toBeInTheDocument();
  });
});
