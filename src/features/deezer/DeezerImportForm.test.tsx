import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// IonInput/IonButton → plain elements so we can drive onIonInput and observe the
// `disabled` attribute (the real web components consume both in jsdom).
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonInput: ({
      value,
      onIonInput,
      ...rest
    }: {
      value?: string;
      onIonInput?: (e: { detail: { value: string } }) => void;
      [k: string]: unknown;
    }) => (
      <input
        {...(rest as Record<string, unknown>)}
        value={value ?? ''}
        onChange={(e) => onIonInput?.({ detail: { value: e.target.value } })}
      />
    ),
    IonButton: ({ children, onClick, ...rest }: React.ComponentProps<'button'>) => (
      <button onClick={onClick} {...rest}>
        {children}
      </button>
    ),
    IonSpinner: () => <span data-testid="spinner" />,
  };
});

import { DeezerImportForm } from './DeezerImportForm';

describe('DeezerImportForm', () => {
  it('links to a Spotify→Deezer converter', () => {
    render(<DeezerImportForm importing={false} onImport={vi.fn()} />);
    const link = screen.getByTestId('deezer-spotify-help');
    expect(link).toHaveAttribute('href', expect.stringContaining('spotify-to-deezer'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('disables Import until a valid playlist is entered', () => {
    render(<DeezerImportForm importing={false} onImport={vi.fn()} />);
    expect(screen.getByTestId('deezer-import')).toBeDisabled();
    fireEvent.change(screen.getByTestId('deezer-url'), { target: { value: 'not-a-link' } });
    expect(screen.getByTestId('deezer-import')).toBeDisabled();
    fireEvent.change(screen.getByTestId('deezer-url'), { target: { value: '908622995' } });
    expect(screen.getByTestId('deezer-import')).toBeEnabled();
  });

  it('imports the entered link when valid', () => {
    const onImport = vi.fn();
    render(<DeezerImportForm importing={false} onImport={onImport} />);
    fireEvent.change(screen.getByTestId('deezer-url'), {
      target: { value: 'https://www.deezer.com/playlist/908622995' },
    });
    fireEvent.click(screen.getByTestId('deezer-import'));
    expect(onImport).toHaveBeenCalledWith('https://www.deezer.com/playlist/908622995');
  });

  it('shows a spinner and disables Import while importing', () => {
    render(<DeezerImportForm importing onImport={vi.fn()} />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.getByTestId('deezer-import')).toBeDisabled();
  });
});
