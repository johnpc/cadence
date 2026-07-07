import { describe, it, expect, beforeEach } from 'vitest';
import {
  DEFAULT_PREFERENCE,
  THEME_STORAGE_KEY,
  isThemePreference,
  readStoredPreference,
  storePreference,
} from './themeStorage';

describe('themeStorage', () => {
  beforeEach(() => localStorage.clear());

  it('validates theme preferences', () => {
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('sepia')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });

  it('falls back to the default when nothing valid is stored', () => {
    expect(readStoredPreference()).toBe(DEFAULT_PREFERENCE);
    localStorage.setItem(THEME_STORAGE_KEY, 'bogus');
    expect(readStoredPreference()).toBe(DEFAULT_PREFERENCE);
  });

  it('round-trips a stored preference', () => {
    storePreference('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(readStoredPreference()).toBe('light');
  });
});
