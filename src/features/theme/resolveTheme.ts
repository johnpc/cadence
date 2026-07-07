/** Pure resolution of a stored preference + the OS setting to a palette. */
import type { EffectiveTheme, ThemePreference } from './types';

export function resolveEffectiveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): EffectiveTheme {
  if (preference === 'system') return systemPrefersDark ? 'dark' : 'light';
  return preference;
}
