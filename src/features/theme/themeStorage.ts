/** Persistence + default for the theme preference (localStorage, per-device). */
import type { ThemePreference } from './types';

export const THEME_STORAGE_KEY = 'cadence.theme-preference';

/**
 * Out-of-the-box default: dark, the Spotify-like near-black canvas the app is
 * designed around. Users can switch to Light or System in Appearance (and an
 * AA-clean light palette ships in variables.css for when they do).
 */
export const DEFAULT_PREFERENCE: ThemePreference = 'dark';

const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return typeof value === 'string' && (PREFERENCES as readonly string[]).includes(value);
}

/** The stored preference, or the default when none is stored / it's invalid. */
export function readStoredPreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  return isThemePreference(stored) ? stored : DEFAULT_PREFERENCE;
}

export function storePreference(preference: ThemePreference): void {
  localStorage.setItem(THEME_STORAGE_KEY, preference);
}
