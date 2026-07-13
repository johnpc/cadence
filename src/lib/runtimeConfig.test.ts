import { afterEach, describe, expect, it } from 'vitest';
import {
  castReceiverAppId,
  configuredMarlinUrl,
  configuredServerUrl,
  signupUrl,
} from './runtimeConfig';

afterEach(() => {
  delete window.__CADENCE_CONFIG__;
});

describe('configuredMarlinUrl', () => {
  it('returns null when unset (off by default)', () => {
    expect(configuredMarlinUrl()).toBeNull();
  });
  it('returns a valid https URL when set', () => {
    window.__CADENCE_CONFIG__ = { marlinUrl: 'https://search.example.com' };
    expect(configuredMarlinUrl()).toBe('https://search.example.com/');
  });
  it('rejects a non-http(s) value', () => {
    window.__CADENCE_CONFIG__ = { marlinUrl: 'javascript:alert(1)' };
    expect(configuredMarlinUrl()).toBeNull();
  });
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

describe('configuredServerUrl', () => {
  it('returns null when unset', () => {
    expect(configuredServerUrl()).toBeNull();
    window.__CADENCE_CONFIG__ = {};
    expect(configuredServerUrl()).toBeNull();
  });

  it('returns a valid server URL', () => {
    window.__CADENCE_CONFIG__ = { serverUrl: 'https://jf.example.com' };
    expect(configuredServerUrl()).toBe('https://jf.example.com/');
  });

  it('rejects non-http(s) values', () => {
    window.__CADENCE_CONFIG__ = { serverUrl: 'ftp://nope' };
    expect(configuredServerUrl()).toBeNull();
  });
});

describe('castReceiverAppId', () => {
  it('returns null when unset', () => {
    expect(castReceiverAppId()).toBeNull();
    window.__CADENCE_CONFIG__ = {};
    expect(castReceiverAppId()).toBeNull();
  });

  it('returns a valid alphanumeric app id, trimmed', () => {
    window.__CADENCE_CONFIG__ = { castReceiverAppId: '  A1B2C3D4  ' };
    expect(castReceiverAppId()).toBe('A1B2C3D4');
  });

  it('rejects malformed ids (wrong chars or length)', () => {
    window.__CADENCE_CONFIG__ = { castReceiverAppId: 'has space' };
    expect(castReceiverAppId()).toBeNull();
    window.__CADENCE_CONFIG__ = { castReceiverAppId: 'ab' }; // too short
    expect(castReceiverAppId()).toBeNull();
    window.__CADENCE_CONFIG__ = { castReceiverAppId: 'javascript:alert(1)' };
    expect(castReceiverAppId()).toBeNull();
  });
});
