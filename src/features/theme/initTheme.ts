/** Startup theme application — call before React renders to avoid a flash of the
 * wrong palette. ThemeProvider takes over for live updates once mounted. */
import { readStoredPreference } from './themeStorage';
import { resolveEffectiveTheme } from './resolveTheme';
import { systemPrefersDark, applyTheme } from './applyTheme';

export function initTheme(): void {
  const preference = readStoredPreference();
  applyTheme(resolveEffectiveTheme(preference, systemPrefersDark()));
}
