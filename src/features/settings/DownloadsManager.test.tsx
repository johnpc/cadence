import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Render IonAlert's buttons inline so the confirm step is clickable in jsdom.
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonAlert: ({
      isOpen,
      buttons,
    }: {
      isOpen: boolean;
      buttons: { text: string; handler?: () => void }[];
    }) =>
      isOpen ? (
        <div>
          {buttons.map((b) => (
            <button key={b.text} onClick={b.handler}>
              {b.text}
            </button>
          ))}
        </div>
      ) : null,
  };
});

vi.mock('../downloads/useDownloads', () => ({ useDownloads: vi.fn() }));
vi.mock('../downloads/downloadStore', () => ({
  removeAllDownloads: vi.fn().mockResolvedValue(undefined),
}));
import { useDownloads } from '../downloads/useDownloads';
import { removeAllDownloads } from '../downloads/downloadStore';
import { DownloadsManager } from './DownloadsManager';
import { ToastContext } from '../toast/ToastContext';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const render_ = () =>
  render(
    <ToastContext.Provider value={vi.fn()}>
      <DownloadsManager />
    </ToastContext.Provider>,
  );
const stub = (n: number) =>
  vi.mocked(useDownloads).mockReturnValue({
    tracks: Array.from({ length: n }, (_, i) => ({ Id: `t${i}` }) as JellyfinItem),
  });

describe('DownloadsManager', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when there are no downloads', () => {
    stub(0);
    const { container } = render_();
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the count (pluralised) when there are downloads', () => {
    stub(3);
    render_();
    expect(screen.getByTestId('downloads-count')).toHaveTextContent('3 tracks');
  });

  it('uses the singular for a single download', () => {
    stub(1);
    render_();
    expect(screen.getByTestId('downloads-count')).toHaveTextContent('1 track saved');
  });

  it('removes all downloads after confirming', async () => {
    stub(2);
    render_();
    await userEvent.click(screen.getByTestId('remove-all-downloads'));
    await userEvent.click(screen.getByText('Remove')); // confirm in the alert
    expect(removeAllDownloads).toHaveBeenCalledOnce();
  });
});
