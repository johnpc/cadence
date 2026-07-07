import { describe, expect, it } from 'vitest';
import { apiUrl, embyAuthHeader, JELLYFIN_URL } from './jellyfinConfig';

describe('jellyfinConfig', () => {
  it('exposes a trailing-slash-free base URL', () => {
    expect(JELLYFIN_URL.endsWith('/')).toBe(false);
  });

  it('builds absolute API URLs', () => {
    expect(apiUrl('/Users/Me')).toBe(`${JELLYFIN_URL}/Users/Me`);
  });

  it('builds the emby auth header with client + device, no token by default', () => {
    const header = embyAuthHeader();
    expect(header).toMatch(/^MediaBrowser /);
    expect(header).toContain('Client="Cadence"');
    expect(header).toContain('DeviceId=');
    expect(header).not.toContain('Token=');
  });

  it('includes the token when provided', () => {
    expect(embyAuthHeader('abc123')).toContain('Token="abc123"');
  });
});
