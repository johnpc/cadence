import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ThemeContext } from './ThemeContext';
import { readStoredPreference, storePreference } from './themeStorage';
import { resolveEffectiveTheme } from './resolveTheme';
import { systemPrefersDark, applyTheme, watchSystemTheme } from './applyTheme';
import type { EffectiveTheme, ThemePreference } from './types';

/**
 * Holds the theme preference, applies the resolved palette to <html>, and — while
 * the preference is 'system' — follows the OS color scheme live. Mirrors the
 * auth Context+Hook+Provider shape.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStoredPreference);
  const [effective, setEffective] = useState<EffectiveTheme>(() =>
    resolveEffectiveTheme(preference, systemPrefersDark()),
  );

  useEffect(() => {
    const apply = () => {
      const next = resolveEffectiveTheme(preference, systemPrefersDark());
      setEffective(next);
      applyTheme(next);
    };
    apply();
    if (preference !== 'system') return;
    return watchSystemTheme(apply);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    storePreference(next);
    setPreferenceState(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ preference, effective, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}
