import { describe, expect, it } from 'vitest';
import { apiUrl, embyAuthHeader } from './jellyfinConfig';
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
});
