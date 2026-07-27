import { describe, expect, it } from 'vitest';
import { apiUrl, restUrl, subsonicAuthParams } from './navidromeConfig';
import { getServerUrl } from './serverUrlStore';

describe('navidromeConfig', () => {
  it('builds absolute REST URLs against the active server, under /rest', () => {
    expect(restUrl('/getUser')).toBe(`${getServerUrl()}/rest/getUser`);
  });

  it('builds absolute native API URLs (no /rest prefix)', () => {
    expect(apiUrl('/auth/login')).toBe(`${getServerUrl()}/auth/login`);
  });

  it('omits u/t/s when signed out, but still sets v/c/f', () => {
    const params = subsonicAuthParams(null);
    expect(params.get('v')).toBe('1.16.1');
    expect(params.get('c')).toBe('Cadence');
    expect(params.get('f')).toBe('json');
    expect(params.has('u')).toBe(false);
    expect(params.has('t')).toBe(false);
    expect(params.has('s')).toBe(false);
  });

  it('includes u/t/s from the session when signed in', () => {
    const params = subsonicAuthParams({
      username: 'cadence-test',
      userId: 'u1',
      subsonicSalt: 'salt1',
      subsonicToken: 'tok1',
    });
    expect(params.get('u')).toBe('cadence-test');
    expect(params.get('t')).toBe('tok1');
    expect(params.get('s')).toBe('salt1');
  });
});
