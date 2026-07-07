import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { systemPrefersDark, applyTheme, watchSystemTheme } from './applyTheme';

const realMatchMedia = window.matchMedia;

/** A controllable matchMedia: read .matches, fire 'change' to registered listeners. */
function mockMatchMedia(dark: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches: dark,
    media: '(prefers-color-scheme: dark)',
    addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => listeners.delete(cb),
  };
  window.matchMedia = vi.fn(() => mql) as unknown as typeof window.matchMedia;
  return {
    listeners,
    emit: (next: boolean) => {
      mql.matches = next;
      listeners.forEach((cb) => cb({ matches: next } as MediaQueryListEvent));
    },
  };
}

describe('applyTheme module', () => {
  beforeEach(() => {
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.classList.remove('ion-palette-dark');
  });
  afterEach(() => {
    window.matchMedia = realMatchMedia;
  });

  it('reads the OS dark preference', () => {
    mockMatchMedia(true);
    expect(systemPrefersDark()).toBe(true);
    mockMatchMedia(false);
    expect(systemPrefersDark()).toBe(false);
  });

  it('applies dark: sets data-theme and the Ionic palette class', () => {
    applyTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(true);
  });

  it('applies light: sets data-theme and drops the Ionic palette class', () => {
    applyTheme('dark');
    applyTheme('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBe(false);
  });

  it('watches OS changes and unsubscribes', () => {
    const media = mockMatchMedia(false);
    const onChange = vi.fn();
    const stop = watchSystemTheme(onChange);
    media.emit(true);
    expect(onChange).toHaveBeenCalledWith(true);
    stop();
    expect(media.listeners.size).toBe(0);
  });
});
