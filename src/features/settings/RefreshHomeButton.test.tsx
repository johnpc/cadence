import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../lib/runtimeConfig', () => ({ homeShelvesEnabled: vi.fn() }));
vi.mock('./refreshHome', () => ({ refreshHomeShelves: vi.fn() }));
const toast = vi.fn();
vi.mock('../toast/useToast', () => ({ useToast: () => toast }));

import { homeShelvesEnabled } from '../../lib/runtimeConfig';
import { refreshHomeShelves } from './refreshHome';
import { RefreshHomeButton } from './RefreshHomeButton';

afterEach(() => {
  vi.resetAllMocks();
});

describe('RefreshHomeButton', () => {
  it('renders nothing when the plugin fast-path is off (nothing to invalidate)', () => {
    vi.mocked(homeShelvesEnabled).mockReturnValue(false);
    const { container } = render(<RefreshHomeButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('refreshes + toasts on success when the plugin is available', async () => {
    vi.mocked(homeShelvesEnabled).mockReturnValue(true);
    vi.mocked(refreshHomeShelves).mockResolvedValue();
    render(<RefreshHomeButton />);
    await userEvent.click(screen.getByTestId('settings-refresh-home'));
    await waitFor(() => expect(refreshHomeShelves).toHaveBeenCalled());
    expect(toast).toHaveBeenCalledWith('Home recommendations refreshed');
  });

  it('toasts a failure message when the refresh errors', async () => {
    vi.mocked(homeShelvesEnabled).mockReturnValue(true);
    vi.mocked(refreshHomeShelves).mockRejectedValue(new Error('down'));
    render(<RefreshHomeButton />);
    await userEvent.click(screen.getByTestId('settings-refresh-home'));
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Could not refresh right now'));
  });
});
