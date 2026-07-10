import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

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
import { ClearCacheButton } from './ClearCacheButton';
import { ToastContext } from '../toast/ToastContext';

function renderButton(toast = vi.fn()) {
  const client = new QueryClient();
  const clearSpy = vi.spyOn(client, 'clear');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <ToastContext.Provider value={toast}>{children}</ToastContext.Provider>
    </QueryClientProvider>
  );
  render(<ClearCacheButton />, { wrapper });
  return { clearSpy };
}

describe('ClearCacheButton', () => {
  it('confirms before clearing — no clear on the initial tap', async () => {
    const { clearSpy } = renderButton();
    await userEvent.click(screen.getByTestId('settings-clear-cache'));
    expect(clearSpy).not.toHaveBeenCalled();
  });

  it('clears the cache and toasts after confirming', async () => {
    const toast = vi.fn();
    const { clearSpy } = renderButton(toast);
    await userEvent.click(screen.getByTestId('settings-clear-cache'));
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    await waitFor(() => expect(clearSpy).toHaveBeenCalledOnce());
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Cache cleared'));
  });
});
