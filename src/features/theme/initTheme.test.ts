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

  it('defaults to dark when nothing is stored, regardless of the OS setting', () => {
    // OS is light (beforeEach) but the app default is dark now.
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
