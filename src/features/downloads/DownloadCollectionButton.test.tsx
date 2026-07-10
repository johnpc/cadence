import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useDownloadCollection', () => ({ useDownloadCollection: vi.fn() }));
import { useDownloadCollection } from './useDownloadCollection';
import { DownloadCollectionButton } from './DownloadCollectionButton';
import { renderWithProviders } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks = [{ Id: 'a', Name: 'A' }] as JellyfinItem[];
const stub = (over: Partial<ReturnType<typeof useDownloadCollection>>) =>
  vi.mocked(useDownloadCollection).mockReturnValue({
    state: 'none',
    progress: { done: 0, total: 1 },
    busy: false,
    downloadAll: vi.fn(),
    removeAll: vi.fn(),
    ...over,
  });

describe('DownloadCollectionButton', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders nothing for an empty collection', () => {
    stub({});
    const { container } = renderWithProviders(<DownloadCollectionButton tracks={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('downloads the whole collection on tap', async () => {
    const downloadAll = vi.fn();
    stub({ state: 'none', downloadAll });
    renderWithProviders(<DownloadCollectionButton tracks={tracks} />);
    await userEvent.click(screen.getByTestId('download-collection'));
    expect(downloadAll).toHaveBeenCalledOnce();
  });

  it('shows a live count while downloading', () => {
    stub({ state: 'downloading', busy: true, progress: { done: 2, total: 5 } });
    renderWithProviders(<DownloadCollectionButton tracks={tracks} />);
    expect(screen.getByTestId('download-progress')).toHaveTextContent('2/5');
    expect(screen.getByTestId('download-collection')).toBeDisabled();
  });

  it('removes all when already downloaded', async () => {
    const removeAll = vi.fn();
    stub({ state: 'downloaded', removeAll });
    renderWithProviders(<DownloadCollectionButton tracks={tracks} />);
    const btn = screen.getByTestId('download-collection');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(btn);
    expect(removeAll).toHaveBeenCalledOnce();
  });

  it('reflects a partial state distinctly', () => {
    stub({ state: 'partial' });
    renderWithProviders(<DownloadCollectionButton tracks={tracks} />);
    expect(screen.getByTestId('download-collection')).toHaveAttribute('data-state', 'partial');
  });
});
