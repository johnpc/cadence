import { describe, expect, it } from 'vitest';
import { apiUrl, authHeaders, embyAuthHeader } from './jellyfinConfig';
import { getServerUrl } from './serverUrlStore';

describe('jellyfinConfig', () => {
  it('builds absolute API URLs against the active server', () => {
    expect(apiUrl('/Users/Me')).toBe(`${getServerUrl()}/Users/Me`);
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

  it('sends the FULL header in both Authorization and the legacy X-Emby-Authorization', () => {
    // Jellyfin 12 400s a request whose only auth header is X-Emby-Authorization.
    const headers = authHeaders('abc123');
    expect(headers.Authorization).toContain('Client="Cadence"');
    expect(headers.Authorization).toContain('Token="abc123"');
    expect(headers['X-Emby-Authorization']).toBe(headers.Authorization);
    expect(authHeaders().Authorization).not.toContain('Token=');
  });
});
