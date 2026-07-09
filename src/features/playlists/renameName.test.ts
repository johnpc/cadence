import { describe, expect, it } from 'vitest';
import { nextPlaylistName } from './renameName';

describe('nextPlaylistName', () => {
  it('returns the trimmed name when it differs from the current', () => {
    expect(nextPlaylistName('  New Mix  ', 'Old')).toBe('New Mix');
  });

  it('returns null when unchanged (after trimming)', () => {
    expect(nextPlaylistName('Same', 'Same')).toBeNull();
    expect(nextPlaylistName('  Same  ', 'Same')).toBeNull();
  });

  it('returns null for an empty or whitespace-only name', () => {
    expect(nextPlaylistName('', 'Old')).toBeNull();
    expect(nextPlaylistName('   ', 'Old')).toBeNull();
    expect(nextPlaylistName(undefined, 'Old')).toBeNull();
  });
});
