/** DOM edges for theming: read the OS setting, apply the palette, watch changes. */
import { syncStatusBar } from '../../lib/statusBar';
import type { EffectiveTheme } from './types';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Whether the OS currently prefers a dark color scheme. */
export function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches;
}

/**
 * Apply the effective palette to <html>: our token attribute (data-theme drives
 * the --cad-* overrides) plus Ionic's .ion-palette-dark class (dark.class.css).
 */
export function applyTheme(effective: EffectiveTheme): void {
  const root = document.documentElement;
  root.dataset.theme = effective;
  root.classList.toggle('ion-palette-dark', effective === 'dark');
  syncStatusBar(effective); // keep the native status bar in step (no-op on web)
}

/** Subscribe to OS color-scheme changes; returns an unsubscribe fn. */
export function watchSystemTheme(onChange: (prefersDark: boolean) => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  const handler = (event: MediaQueryListEvent): void => onChange(event.matches);
  query.addEventListener('change', handler);
  return () => query.removeEventListener('change', handler);
}
