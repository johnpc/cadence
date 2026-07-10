import type { useHomeShelves } from './HomeShelves';

type Shelves = ReturnType<typeof useHomeShelves>;

/** True once every Home shelf has finished loading (none still in flight, none
 * errored) yet ALL came back empty. That means the signed-in Jellyfin user can
 * authenticate but sees no music — almost always because their account lacks
 * access to the music library — so Home should say so rather than show a wall
 * of "Nothing here yet" that reads like an empty server. */
export function isLibraryInaccessible(shelves: Shelves): boolean {
  const all = [
    shelves.albums,
    shelves.suggested,
    shelves.saved,
    shelves.recent,
    shelves.artists,
    shelves.jumpBackIn,
  ];
  const settled = all.every((s) => !s.isLoading && !s.isError);
  if (!settled) return false;
  const counts =
    shelves.albums.albums.length +
    shelves.suggested.songs.length +
    shelves.saved.albums.length +
    shelves.recent.songs.length +
    shelves.artists.artists.length +
    shelves.jumpBackIn.items.length;
  return counts === 0;
}
