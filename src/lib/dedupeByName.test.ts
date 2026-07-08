import { describe, expect, it } from 'vitest';
import { dedupeByName } from './dedupeByName';
import type { JellyfinItem } from './jellyfinTypes';

const item = (id: string, name: string): JellyfinItem => ({ Id: id, Name: name, Type: 'Playlist' });

describe('dedupeByName', () => {
  it('keeps the first of same-named items, preserving order', () => {
    const out = dedupeByName([item('1', 'Chill'), item('2', 'Focus'), item('3', 'Chill')]);
    expect(out.map((i) => i.Id)).toEqual(['1', '2']);
  });

  it('matches names case-insensitively and trims whitespace', () => {
    const out = dedupeByName([item('1', 'Road Trip'), item('2', ' road trip ')]);
    expect(out.map((i) => i.Id)).toEqual(['1']);
  });

  it('passes a unique list through unchanged', () => {
    const list = [item('1', 'A'), item('2', 'B')];
    expect(dedupeByName(list)).toHaveLength(2);
  });
});
