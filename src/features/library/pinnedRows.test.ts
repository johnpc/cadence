import { describe, expect, it } from 'vitest';
import { pinnedRows } from './pinnedRows';

describe('pinnedRows', () => {
  it('always includes Liked Songs first', () => {
    const rows = pinnedRows(5, 0);
    expect(rows[0]).toMatchObject({ to: '/liked', liked: true, pinned: true });
    expect(rows[0].subtitle).toBe('Playlist • 5 songs');
  });

  it('omits Downloads when there are none', () => {
    expect(pinnedRows(2, 0).some((r) => r.downloads)).toBe(false);
    expect(pinnedRows(2, 0)).toHaveLength(1);
  });

  it('adds Downloads (after Liked Songs) when non-empty', () => {
    const rows = pinnedRows(2, 3);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ to: '/downloads', downloads: true, pinned: true });
    expect(rows[1].subtitle).toBe('Playlist • 3 songs');
  });

  it('uses the singular for single counts', () => {
    const rows = pinnedRows(1, 1);
    expect(rows[0].subtitle).toBe('Playlist • 1 song');
    expect(rows[1].subtitle).toBe('Playlist • 1 song');
  });
});
