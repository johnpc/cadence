import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './useTheme';
import { THEME_STORAGE_KEY } from './themeStorage';

const realMatchMedia = window.matchMedia;
let media: { emit: (dark: boolean) => void };

function mockMatchMedia(dark: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches: dark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
  };
  window.matchMedia = vi.fn(() => mql) as unknown as typeof window.matchMedia;
  return {
    emit: (next: boolean) => {
      mql.matches = next;
      listeners.forEach((cb) => cb({ matches: next } as MediaQueryListEvent));
    },
  };
}

function Probe() {
  const { preference, effective, setPreference } = useTheme();
  return (
    <div>
      <span data-testid="pref">{preference}</span>
      <span data-testid="eff">{effective}</span>
      <button onClick={() => setPreference('light')}>to-light</button>
      <button onClick={() => setPreference('system')}>to-system</button>
    </div>
  );
}

const renderProbe = () =>
  render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('ion-palette-dark');
    media = mockMatchMedia(false);
  });
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it('defaults to dark, regardless of the OS appearance', () => {
    renderProbe(); // OS is light in beforeEach, but the app default is dark
    expect(screen.getByTestId('pref')).toHaveTextContent('dark');
    expect(screen.getByTestId('eff')).toHaveTextContent('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
  });

  it('persists and applies a light preference', () => {
    renderProbe();
    fireEvent.click(screen.getByText('to-light'));
    expect(screen.getByTestId('eff')).toHaveTextContent('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('follows the OS live while the preference is system', () => {
    renderProbe();
    fireEvent.click(screen.getByText('to-system'));
    expect(screen.getByTestId('eff')).toHaveTextContent('light'); // OS currently light
    act(() => media.emit(true)); // OS flips to dark
    expect(screen.getByTestId('eff')).toHaveTextContent('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

describe('useTheme', () => {
  it('throws when used outside a ThemeProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/within a ThemeProvider/);
    spy.mockRestore();
  });
});
