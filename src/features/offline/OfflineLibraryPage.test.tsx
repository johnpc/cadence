import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./OfflineLibrary', () => ({
  OfflineLibrary: () => <div data-testid="offline-library" />,
}));
import { OfflineLibraryPage } from './OfflineLibraryPage';
import { renderWithProviders } from '../../test/renderWithProviders';

describe('OfflineLibraryPage', () => {
  it('renders the offline library inside a page', () => {
    renderWithProviders(<OfflineLibraryPage />);
    expect(screen.getByTestId('offline-library')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('exposes a Settings link so offline mode can be turned back off', () => {
    // Offline mode hides the Library tab (where Settings usually lives), so the
    // offline page MUST carry its own Settings gear — otherwise the toggle is a
    // one-way trap.
    renderWithProviders(<OfflineLibraryPage />);
    expect(screen.getByTestId('offline-settings')).toHaveAttribute('router-link', '/settings');
  });
});
