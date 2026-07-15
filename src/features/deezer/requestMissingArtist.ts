/** Request a Deezer "missing artist" via Lidarr. Deezer only gives us the artist
 * NAME, so resolve it to a MusicBrainz artist by searching Lidarr, then request
 * the top match — reusing the same Lidarr client the Requests screen uses (the
 * write-capable key stays server-side). */
import {
  searchArtists,
  getAddDefaults,
  requestArtist,
  AlreadyAddedError,
} from '../requests/lidarrApi';

/** Search Lidarr for the named artist and request the first match. An already-
 * added artist (AlreadyAddedError) is treated as success — it's in the library.
 * Throws when the name resolves to no Lidarr artist. */
export async function requestMissingArtist(name: string): Promise<void> {
  const matches = await searchArtists(name);
  const artist = matches[0];
  if (!artist) throw new Error(`No Lidarr match for ${name}`);
  try {
    await requestArtist(artist, await getAddDefaults());
  } catch (e) {
    if (e instanceof AlreadyAddedError) return; // already in the library — fine
    throw e;
  }
}
