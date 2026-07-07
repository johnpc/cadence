import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initTheme } from './initTheme';
import { THEME_STORAGE_KEY } from './themeStorage';

const realMatchMedia = window.matchMedia;
const setSystemDark = (dark: boolean) => {
  window.matchMedia = vi.fn(() => ({ matches: dark })) as unknown as typeof window.matchMedia;
};

describe('initTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('ion-palette-dark');
    setSystemDark(false);
  });
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it('applies a stored light preference', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light');
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);
  });

  it('follows the system appearance when nothing is stored (default = system)', () => {
    // beforeEach sets the OS to light → system default resolves to light.
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);

    // …and a dark OS resolves to dark.
    setSystemDark(true);
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
  });

  it('resolves a system preference against the OS setting', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'system');
    setSystemDark(true);
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});
