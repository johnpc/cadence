/** Persistence + default for the theme preference (localStorage, per-device). */
import type { ThemePreference } from './types';

export const THEME_STORAGE_KEY = 'cadence.theme-preference';

/**
 * Out-of-the-box default: follow the OS appearance. Light mode ships with an
 * AA-clean accent (see variables.css), so a system-default user on a light OS
 * gets a compliant palette; users can still force light/dark in Appearance.
 */
export const DEFAULT_PREFERENCE: ThemePreference = 'system';

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
