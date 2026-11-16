import { render, screen, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const store = { url: '', key: '', setMusicGrabber: vi.fn() };
vi.mock('../../lib/musicGrabberStore', () => ({
  getMusicGrabberUrl: () => store.url,
  getMusicGrabberKey: () => store.key,
  setMusicGrabber: (u: string, k: string) => store.setMusicGrabber(u, k),
}));

// IonInput → a plain input so we can drive onIonInput via native change events.
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

import { GrabBackend } from './GrabBackend';

afterEach(() => {
  store.url = '';
  store.key = '';
  vi.clearAllMocks();
});

describe('GrabBackend', () => {
  it('saves the entered URL + key to the store', () => {
    render(<GrabBackend />);
    fireEvent.change(screen.getByTestId('grab-url'), { target: { value: 'https://mg.jpc.io' } });
    fireEvent.change(screen.getByTestId('grab-key'), { target: { value: 'k123' } });
    fireEvent.click(screen.getByTestId('grab-save'));
    expect(store.setMusicGrabber).toHaveBeenCalledWith('https://mg.jpc.io', 'k123');
    expect(screen.getByTestId('grab-save')).toHaveTextContent('Saved');
  });

  it('seeds the fields from the store', () => {
    store.url = 'https://existing.io';
    render(<GrabBackend />);
    expect((screen.getByTestId('grab-url') as HTMLInputElement).value).toBe('https://existing.io');
  });
});
