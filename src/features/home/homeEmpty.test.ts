import { describe, expect, it } from 'vitest';
import { isLibraryInaccessible } from './homeEmpty';

type Shelves = Parameters<typeof isLibraryInaccessible>[0];

/** Build a shelves object; every shelf settled + empty by default. Override any
 * shelf's fields to simulate loading/error/populated. */
function shelves(overrides: Partial<Record<string, unknown>> = {}): Shelves {
  const empty = { isLoading: false, isError: false };
  return {
    albums: { ...empty, albums: [] },
    suggested: { ...empty, songs: [] },
    saved: { ...empty, albums: [] },
    recent: { ...empty, songs: [] },
    artists: { ...empty, artists: [] },
    jumpBackIn: { ...empty, items: [] },
    ...overrides,
  } as unknown as Shelves;
}

describe('isLibraryInaccessible', () => {
  it('is true when every shelf has settled empty', () => {
    expect(isLibraryInaccessible(shelves())).toBe(true);
  });

  it('is false while any shelf is still loading', () => {
    expect(
      isLibraryInaccessible(shelves({ albums: { isLoading: true, isError: false, albums: [] } })),
    ).toBe(false);
  });

  it('is false when any shelf errored (a fetch problem, not a permissions one)', () => {
    expect(
      isLibraryInaccessible(shelves({ suggested: { isLoading: false, isError: true, songs: [] } })),
    ).toBe(false);
  });

  it('is false when any shelf has items', () => {
    expect(
      isLibraryInaccessible(
        shelves({ albums: { isLoading: false, isError: false, albums: [{ Id: 'a1' }] } }),
      ),
    ).toBe(false);
  });
});
