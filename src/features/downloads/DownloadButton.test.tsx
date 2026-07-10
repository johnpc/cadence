import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./downloadStore', () => ({
  downloadTrack: vi.fn(),
  removeDownload: vi.fn(),
  isDownloaded: vi.fn(() => false),
}));
import { downloadTrack, isDownloaded } from './downloadStore';
import { DownloadButton } from './DownloadButton';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const track: JellyfinItem = { Id: 't1', Name: 'x', Type: 'Audio' };

describe('DownloadButton', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('downloads on click and reflects the downloaded state', async () => {
    vi.mocked(downloadTrack).mockResolvedValue();
    renderWithProviders(<DownloadButton track={track} />);
    const btn = screen.getByTestId('download-button');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).toHaveAttribute('data-state', 'none');
    await userEvent.click(btn);
    await waitFor(() => expect(btn).toHaveAttribute('aria-pressed', 'true'));
    expect(btn).toHaveAttribute('data-state', 'downloaded');
    expect(downloadTrack).toHaveBeenCalledWith(track);
  });

  it('renders as downloaded when the track is already saved', () => {
    vi.mocked(isDownloaded).mockReturnValue(true);
    renderWithProviders(<DownloadButton track={track} />);
    const btn = screen.getByTestId('download-button');
    expect(btn).toHaveAttribute('data-state', 'downloaded');
    expect(btn).toHaveAttribute('aria-label', 'Remove download');
  });
});
