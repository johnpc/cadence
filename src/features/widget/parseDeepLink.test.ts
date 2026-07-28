import { describe, expect, it } from 'vitest';
import { parseOpenPath } from './parseDeepLink';

describe('parseOpenPath', () => {
  it('extracts the decoded path from a cadence open link', () => {
    expect(parseOpenPath('cadence://open?path=%2Faudiobooks')).toBe('/audiobooks');
    expect(parseOpenPath('cadence://open?path=%2Falbum%2Fa1')).toBe('/album/a1');
  });

  it('rejects a non-cadence scheme', () => {
    expect(parseOpenPath('https://open?path=%2Fhome')).toBeNull();
  });

  it('rejects the wrong host', () => {
    expect(parseOpenPath('cadence://play?path=%2Fhome')).toBeNull();
  });

  it('rejects a missing or off-app path', () => {
    expect(parseOpenPath('cadence://open')).toBeNull();
    expect(parseOpenPath('cadence://open?path=https://evil.com')).toBeNull();
    expect(parseOpenPath('cadence://open?path=%2F%2Fevil.com')).toBeNull();
  });

  it('rejects garbage', () => {
    expect(parseOpenPath('not a url')).toBeNull();
  });
});
