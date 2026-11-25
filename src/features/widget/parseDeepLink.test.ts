import { describe, expect, it } from 'vitest';
import { parseOpenPath } from './parseDeepLink';

describe('parseOpenPath', () => {
  it('extracts the decoded path from a cadence open link', () => {
    expect(parseOpenPath('cadence://open?path=%2Faudiobooks')).toBe('/audiobooks');
    expect(parseOpenPath('cadence://open?path=%2Falbum%2Fa1')).toBe('/album/a1');
  });

  it('rejects a non-cadence scheme', () => {
    expect(parseOpenPath('https://open?path=%2Fhome')).toBeNull();
    expect(parseOpenPath('http://cadence.jpc.io/audiobook/x')).toBeNull();
    expect(parseOpenPath('ftp://cadence.jpc.io/audiobook/x')).toBeNull();
  });

  it('maps a universal link on the claimed host to its in-app path', () => {
    expect(
      parseOpenPath('https://cadence.jpc.io/audiobook/hogfather-discworld-book-20-49614fe6'),
    ).toBe('/audiobook/hogfather-discworld-book-20-49614fe6');
    expect(parseOpenPath('https://CADENCE.jpc.io/album/a1?x=1')).toBe('/album/a1?x=1');
    expect(parseOpenPath('https://cadence.jpc.io')).toBe('/');
  });

  it('ignores https links on any other host', () => {
    expect(parseOpenPath('https://evil.com/audiobook/x')).toBeNull();
    expect(parseOpenPath('https://cadence.jpc.io.evil.com/audiobook/x')).toBeNull();
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
