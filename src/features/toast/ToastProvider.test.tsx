import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

// Render IonToast's message inline when open so we can assert on it (jsdom
// can't run Ionic's overlay controller).
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonToast: ({ isOpen, message }: { isOpen: boolean; message: string }) =>
      isOpen ? <div data-testid="app-toast">{message}</div> : null,
  };
});

import { ToastProvider } from './ToastProvider';
import { useToast } from './useToast';

function Trigger({ children }: { children: ReactNode }) {
  const toast = useToast();
  return (
    <button onClick={() => toast('Added to queue')} type="button">
      {children}
    </button>
  );
}

describe('ToastProvider', () => {
  it('shows a toast message when useToast is called', async () => {
    render(
      <ToastProvider>
        <Trigger>go</Trigger>
      </ToastProvider>,
    );
    expect(screen.queryByTestId('app-toast')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('go'));
    expect(screen.getByTestId('app-toast')).toHaveTextContent('Added to queue');
  });
});
