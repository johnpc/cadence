/** Client for the same-origin Lidarr proxy (/api/lidarr/*). The proxy injects
 * the write-capable API key server-side, so nothing here carries a credential.
 * Only the allowlisted endpoints are reachable (search / profiles / rootfolder /
 * queue / artist). Used by the Requests screen to find + request missing music. */
import type {
  LidarrSearchResult,
  LidarrArtist,
  LidarrOption,
  LidarrAddDefaults,
} from './lidarrTypes';

/** Same-origin Lidarr proxy base (see deploy/runtime-config.sh). */
export const LIDARR_BASE = '/api/lidarr';

export async function lidarrGet<T>(path: string): Promise<T> {
  const res = await fetch(`${LIDARR_BASE}${path}`);
  if (!res.ok) throw new Error(`lidarr ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

const BASE = LIDARR_BASE;
const get = lidarrGet;

/** Search MusicBrainz (via Lidarr) for artists/albums — things not yet in the
 * library. Returns only the artist matches (album requests come later). */
export async function searchArtists(term: string): Promise<LidarrArtist[]> {
  if (!term.trim()) return [];
  const rows = await get<LidarrSearchResult[]>(`/search?term=${encodeURIComponent(term)}`);
  return rows.map((r) => r.artist).filter((a): a is LidarrArtist => !!a && !!a.foreignArtistId);
}

/** MusicBrainz ids of the artists already in Lidarr — so the Requests screen can
 * mark a search result "In your library" instead of offering a doomed re-request
 * (Lidarr 400s on a duplicate add). */
export async function getLibraryArtistIds(): Promise<Set<string>> {
  const artists = await get<LidarrArtist[]>('/artist');
  return new Set(artists.map((a) => a.foreignArtistId).filter(Boolean));
}

/** The add defaults: first root folder + first quality/metadata profile. Lidarr
 * requires all three to add an artist; the first of each is a sensible default. */
export async function getAddDefaults(): Promise<LidarrAddDefaults> {
  const [roots, quality, metadata] = await Promise.all([
    get<LidarrOption[]>('/rootfolder'),
    get<LidarrOption[]>('/qualityprofile'),
    get<LidarrOption[]>('/metadataprofile'),
  ]);
  const rootFolderPath = roots[0]?.path;
  const qualityProfileId = quality[0]?.id;
  const metadataProfileId = metadata[0]?.id;
  if (!rootFolderPath || !qualityProfileId || !metadataProfileId) {
    throw new Error('lidarr is missing a root folder or profile');
  }
  return { rootFolderPath, qualityProfileId, metadataProfileId };
}

/** Add an artist to Lidarr, monitored, and immediately search for its albums —
 * i.e. "request this". Idempotent-ish: Lidarr 400s if already added, which the
 * caller surfaces as "already requested". */
export async function requestArtist(
  artist: LidarrArtist,
  defaults: LidarrAddDefaults,
): Promise<LidarrArtist> {
  const body = {
    artistName: artist.artistName,
    foreignArtistId: artist.foreignArtistId,
    monitored: true,
    ...defaults,
    addOptions: { searchForMissingAlbums: true, monitor: 'all' },
  };
  const res = await fetch(`${BASE}/artist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (res.ok) return (await res.json()) as LidarrArtist;
  // Lidarr 400s a duplicate with an ArtistExistsValidator error — that's not a
  // failure, the artist is already in the library. Surface it as such so the row
  // shows "already requested" instead of a scary error (a stale library-ids
  // cache can let a duplicate request slip through the inLibrary guard).
  if (res.status === 400 && (await res.text()).includes('ArtistExistsValidator')) {
    throw new AlreadyAddedError();
  }
  throw new Error(`lidarr add failed: ${res.status}`);
}

/** Thrown by requestArtist when Lidarr reports the artist is already added —
 * a benign outcome the caller treats as "already requested", not an error. */
export class AlreadyAddedError extends Error {
  constructor() {
    super('artist already added');
    this.name = 'AlreadyAddedError';
  }
}
