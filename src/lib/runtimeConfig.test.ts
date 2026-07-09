import { afterEach, describe, expect, it } from 'vitest';
import { signupUrl } from './runtimeConfig';

afterEach(() => {
  delete window.__CADENCE_CONFIG__;
});

describe('signupUrl', () => {
  it('returns null when no config is present', () => {
    expect(signupUrl()).toBeNull();
  });

  it('returns null when signupUrl is unset or blank', () => {
    window.__CADENCE_CONFIG__ = {};
    expect(signupUrl()).toBeNull();
    window.__CADENCE_CONFIG__ = { signupUrl: '   ' };
    expect(signupUrl()).toBeNull();
  });

  it('returns a valid https URL', () => {
    window.__CADENCE_CONFIG__ = { signupUrl: 'https://s.jpc.io/getthejelly' };
    expect(signupUrl()).toBe('https://s.jpc.io/getthejelly');
  });

  it('accepts http and trims whitespace', () => {
    window.__CADENCE_CONFIG__ = { signupUrl: '  http://sign.up/here  ' };
    expect(signupUrl()).toBe('http://sign.up/here');
  });

  it('rejects non-http(s) schemes (no javascript: XSS via the href)', () => {
    window.__CADENCE_CONFIG__ = { signupUrl: 'javascript:alert(1)' };
    expect(signupUrl()).toBeNull();
  });

  it('rejects a non-URL string', () => {
    window.__CADENCE_CONFIG__ = { signupUrl: 'not a url' };
    expect(signupUrl()).toBeNull();
  });
});
