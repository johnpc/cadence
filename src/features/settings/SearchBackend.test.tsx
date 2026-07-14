import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const store = { url: '', token: '', managed: false, setMarlin: vi.fn() };
vi.mock('../../lib/marlinStore', () => ({
  getMarlinUrl: () => store.url,
  getMarlinToken: () => store.token,
  setMarlin: (u: string, t: string) => store.setMarlin(u, t),
  marlinManagedByServer: () => store.managed,
}));

// IonInput → a plain input so we can drive onIonInput via native input events.
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
  };
});

import { SearchBackend } from './SearchBackend';

afterEach(() => {
  store.url = '';
  store.token = '';
  store.managed = false;
  vi.clearAllMocks();
});

describe('SearchBackend', () => {
  it('saves the entered URL + token to the store', () => {
    render(<SearchBackend />);
    fireEvent.change(screen.getByTestId('marlin-url'), {
      target: { value: 'https://search.example.com' },
    });
    fireEvent.change(screen.getByTestId('marlin-token'), { target: { value: 'tok' } });
    fireEvent.click(screen.getByTestId('marlin-save'));
    expect(store.setMarlin).toHaveBeenCalledWith('https://search.example.com', 'tok');
  });

  it('shows "Saved" after saving, and reverts to "Save" on edit', () => {
    render(<SearchBackend />);
    fireEvent.click(screen.getByTestId('marlin-save'));
    expect(screen.getByTestId('marlin-save')).toHaveTextContent('Saved');
    fireEvent.change(screen.getByTestId('marlin-url'), { target: { value: 'x' } });
    expect(screen.getByTestId('marlin-save')).toHaveTextContent('Save');
  });

  it('seeds the fields from the store (empty by default = off)', () => {
    store.url = 'https://seeded.example.com';
    render(<SearchBackend />);
    expect(screen.getByTestId('marlin-url')).toHaveValue('https://seeded.example.com');
  });

  it('locks the fields (read-only) with an admin note when the server manages the URL', () => {
    store.managed = true;
    store.url = 'https://admin-set.example.com';
    render(<SearchBackend />);
    // URL shown but disabled; token field + Save button hidden; admin note shown.
    const urlField = screen.getByTestId('marlin-url');
    expect(urlField).toHaveValue('https://admin-set.example.com');
    expect(urlField).toBeDisabled();
    expect(screen.queryByTestId('marlin-token')).not.toBeInTheDocument();
    expect(screen.queryByTestId('marlin-save')).not.toBeInTheDocument();
    expect(screen.getByTestId('marlin-managed-note')).toBeInTheDocument();
  });
});
