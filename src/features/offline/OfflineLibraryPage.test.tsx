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
});
