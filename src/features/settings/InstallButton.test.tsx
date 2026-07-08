import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./useInstallPrompt', () => ({ useInstallPrompt: vi.fn() }));
import { useInstallPrompt } from './useInstallPrompt';
import { InstallButton } from './InstallButton';

describe('InstallButton', () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders nothing when install is unavailable', () => {
    vi.mocked(useInstallPrompt).mockReturnValue({ available: false, install: vi.fn() });
    const { container } = render(<InstallButton />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the install button and triggers the prompt', async () => {
    const install = vi.fn().mockResolvedValue(true);
    vi.mocked(useInstallPrompt).mockReturnValue({ available: true, install });
    render(<InstallButton />);
    await userEvent.click(screen.getByTestId('install-app'));
    expect(install).toHaveBeenCalledOnce();
  });
});
