import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ShareButton } from './ShareButton';
import { ToastContext } from '../toast/ToastContext';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album: JellyfinItem = { Id: 'al1', Name: 'Rec', Type: 'MusicAlbum' };

describe('ShareButton', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing without an item', () => {
    const { container } = render(<ShareButton item={null} />);
    expect(container.querySelector('[data-testid="share-button"]')).toBeNull();
  });

  it('copies the link and toasts on success (no native share available)', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const toast = vi.fn();
    render(
      <ToastContext.Provider value={toast}>
        <ShareButton item={album} />
      </ToastContext.Provider>,
    );
    await userEvent.click(screen.getByTestId('share-button'));
    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/album/al1`);
    expect(toast).toHaveBeenCalledWith('Link copied');
  });

  it('opens the native share sheet and toasts "Shared" when supported', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { share });
    const toast = vi.fn();
    render(
      <ToastContext.Provider value={toast}>
        <ShareButton item={album} />
      </ToastContext.Provider>,
    );
    await userEvent.click(screen.getByTestId('share-button'));
    expect(share).toHaveBeenCalledWith({
      title: 'Rec',
      url: `${window.location.origin}/album/al1`,
    });
    expect(toast).toHaveBeenCalledWith('Shared');
  });

  it('stays silent when the user dismisses the share sheet', async () => {
    const abort = Object.assign(new Error('x'), { name: 'AbortError' });
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue(abort) });
    const toast = vi.fn();
    render(
      <ToastContext.Provider value={toast}>
        <ShareButton item={album} />
      </ToastContext.Provider>,
    );
    await userEvent.click(screen.getByTestId('share-button'));
    expect(toast).not.toHaveBeenCalled();
  });
});
