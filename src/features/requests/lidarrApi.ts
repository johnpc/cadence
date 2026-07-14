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

const BASE = '/api/lidarr';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`lidarr ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

/** Search MusicBrainz (via Lidarr) for artists/albums — things not yet in the
 * library. Returns only the artist matches (album requests come later). */
export async function searchArtists(term: string): Promise<LidarrArtist[]> {
  if (!term.trim()) return [];
  const rows = await get<LidarrSearchResult[]>(`/search?term=${encodeURIComponent(term)}`);
  return rows.map((r) => r.artist).filter((a): a is LidarrArtist => !!a && !!a.foreignArtistId);
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
  if (!res.ok) throw new Error(`lidarr add failed: ${res.status}`);
  return (await res.json()) as LidarrArtist;
}
