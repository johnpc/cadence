/** A user's stored appearance choice. 'system' follows the OS color scheme. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** The resolved palette actually applied to the document. */
export type EffectiveTheme = 'light' | 'dark';

export interface ThemeContextValue {
  /** What the user picked (System / Light / Dark). */
  preference: ThemePreference;
  /** The palette currently applied (system resolves to one of these). */
  effective: EffectiveTheme;
  setPreference: (preference: ThemePreference) => void;
}
