/**
 * Minimal Jellyfin REST helper for e2e setup/teardown — lets a scenario create
 * fixtures (e.g. a second user's public playlist) directly against the server,
 * instead of driving fragile UI. Uses the SAME server URL the app build points
 * at (VITE_JELLYFIN_URL). Kept out of the app bundle (e2e-only).
 */
const BASE = (process.env.VITE_JELLYFIN_URL ?? '').replace(/\/+$/, '');

function authHeader(token?: string): string {
  const core =
    'MediaBrowser Client="cadence-e2e", Device="e2e", DeviceId="cadence-e2e-api", Version="1"';
  return token ? `${core}, Token="${token}"` : core;
}

async function api<T>(
  path: string,
  opts: { method?: string; token?: string; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? 'GET',
    headers: {
      'X-Emby-Authorization': authHeader(opts.token),
      ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw new Error(`Jellyfin ${opts.method ?? 'GET'} ${path} → ${res.status}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export interface Session {
  token: string;
  userId: string;
}

/** Authenticate a user by name/password → {token, userId}. */
export async function login(username: string, password: string): Promise<Session> {
  const r = await api<{ AccessToken: string; User: { Id: string } }>('/Users/AuthenticateByName', {
    method: 'POST',
    body: { Username: username, Pw: password },
  });
  return { token: r.AccessToken, userId: r.User.Id };
}

/** Create a playlist owned by `s`, public or private, and return its id. */
export async function createPlaylist(s: Session, name: string, isPublic: boolean): Promise<string> {
  const r = await api<{ Id: string }>('/Playlists', {
    method: 'POST',
    token: s.token,
    body: { Name: name, UserId: s.userId, MediaType: 'Audio', IsPublic: isPublic },
  });
  return r.Id;
}

/** Flip a playlist public/private (owner session). */
export async function setPlaylistPublic(s: Session, id: string, isPublic: boolean): Promise<void> {
  await api(`/Playlists/${id}`, { method: 'POST', token: s.token, body: { IsPublic: isPublic } });
}

/** Delete a playlist (owner session) — teardown. */
export async function deletePlaylist(s: Session, id: string): Promise<void> {
  await api(`/Items/${id}`, { method: 'DELETE', token: s.token });
}

/** Delete ALL of the user's playlists with the given exact name — sweeps stale
 * fixtures a crashed run may have orphaned. Best-effort per item. */
export async function deletePlaylistsByName(s: Session, name: string): Promise<void> {
  const r = await api<{ Items: { Id: string; Name: string }[] }>(
    `/Items?IncludeItemTypes=Playlist&Recursive=true&userId=${s.userId}`,
    { token: s.token },
  );
  const mine = r.Items.filter((p) => p.Name === name);
  await Promise.all(mine.map((p) => deletePlaylist(s, p.Id).catch(() => undefined)));
}
