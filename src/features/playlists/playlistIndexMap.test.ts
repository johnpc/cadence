import { describe, expect, it, vi } from 'vitest';
import { buildPlaylistIndex, reorderProps, removeHandler } from './playlistIndexMap';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const t = (id: string): JellyfinItem => ({ Id: id, Name: id, Type: 'Audio' });

describe('buildPlaylistIndex', () => {
  it('maps each track to its position in the full playlist', () => {
    const a = t('a');
    const b = t('b');
    const c = t('c');
    const idx = buildPlaylistIndex([a, b, c]);
    expect(idx.get(a)).toBe(0);
    expect(idx.get(b)).toBe(1);
    expect(idx.get(c)).toBe(2);
  });

  it('returns undefined for a track not in the playlist', () => {
    const idx = buildPlaylistIndex([t('a')]);
    expect(idx.get(t('z'))).toBeUndefined();
  });

  it('is empty for an empty playlist', () => {
    expect(buildPlaylistIndex([]).size).toBe(0);
  });
});

describe('reorderProps', () => {
  it('returns undefined when the view is not reorderable', () => {
    expect(reorderProps(false, 2, 10, vi.fn())).toBeUndefined();
  });

  it('flags the first and last rows and wires the moves', () => {
    const onMove = vi.fn();
    const first = reorderProps(true, 0, 3, onMove);
    expect(first).toMatchObject({ isFirst: true, isLast: false });
    const last = reorderProps(true, 2, 3, onMove);
    expect(last).toMatchObject({ isFirst: false, isLast: true });
    first?.onMoveDown();
    expect(onMove).toHaveBeenCalledWith(1);
    last?.onMoveUp();
    expect(onMove).toHaveBeenCalledWith(1);
  });
});

describe('removeHandler', () => {
  it('returns undefined when not editable', () => {
    expect(removeHandler(false, 'e1', vi.fn())).toBeUndefined();
  });

  it('returns undefined when there is no entry id', () => {
    expect(removeHandler(true, undefined, vi.fn())).toBeUndefined();
  });

  it('wires the entry id to the remove callback when editable', () => {
    const remove = vi.fn();
    removeHandler(true, 'e1', remove)?.();
    expect(remove).toHaveBeenCalledWith('e1');
  });
});
