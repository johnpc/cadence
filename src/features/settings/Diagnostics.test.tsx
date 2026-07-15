import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const hook = {
  enabled: false,
  setEnabled: vi.fn(),
  uploadEnabled: false,
  setUploadEnabled: vi.fn(),
  uploadConfigured: true,
  endpoint: 'https://logs.example/logs',
  entries: [] as unknown[],
  clear: vi.fn(),
  asText: () => 'the log text',
};
vi.mock('./useDiagnostics', () => ({ useDiagnostics: () => hook }));
vi.mock('../toast/useToast', () => ({ useToast: () => vi.fn() }));

// Ionic toggle/button → plain elements so we can assert presence + disabled.
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonToggle: ({ checked, ...rest }: Record<string, unknown>) => (
      <input type="checkbox" checked={!!checked} readOnly {...(rest as object)} />
    ),
    IonButton: ({ children, ...rest }: React.ComponentProps<'button'>) => (
      <button {...rest}>{children}</button>
    ),
  };
});

import { Diagnostics } from './Diagnostics';

afterEach(() => {
  hook.enabled = false;
  hook.uploadConfigured = true;
  hook.entries = [];
  vi.clearAllMocks();
});

describe('Diagnostics', () => {
  it('shows only the capture toggle when disabled', () => {
    render(<Diagnostics />);
    expect(screen.getByTestId('diagnostics-toggle')).toBeInTheDocument();
    expect(screen.queryByTestId('diagnostics-upload-toggle')).not.toBeInTheDocument();
  });

  it('reveals upload controls + the endpoint URL when enabled', () => {
    hook.enabled = true;
    render(<Diagnostics />);
    expect(screen.getByTestId('diagnostics-upload-toggle')).toBeInTheDocument();
    // The endpoint URL is visible in the UI (user asked to see it's configured).
    expect(screen.getByTestId('diagnostics-endpoint')).toHaveTextContent(
      'https://logs.example/logs',
    );
    expect(screen.getByTestId('diagnostics-copy')).toBeInTheDocument();
  });

  it('disables the upload toggle when no backend is configured', () => {
    hook.enabled = true;
    hook.uploadConfigured = false;
    render(<Diagnostics />);
    expect(screen.getByTestId('diagnostics-upload-toggle')).toBeDisabled();
    expect(screen.queryByTestId('diagnostics-endpoint')).not.toBeInTheDocument();
  });
});
