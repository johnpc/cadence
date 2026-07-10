import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import type { EffectiveTheme } from '../features/theme/types';

/**
 * Match the native iOS/Android status bar to the app palette. The dark canvas
 * needs LIGHT status-bar content (white clock/icons) — which is Capacitor's
 * confusingly-named `Style.Dark` ("light text for dark backgrounds"). No-op on
 * web (there's no native status bar), and guarded so a rejected call can never
 * break theming. Called from applyTheme so the two never drift.
 */
export function syncStatusBar(effective: EffectiveTheme): void {
  if (!Capacitor.isNativePlatform()) return;
  const style = effective === 'dark' ? Style.Dark : Style.Light;
  void StatusBar.setStyle({ style }).catch(() => undefined);
}
