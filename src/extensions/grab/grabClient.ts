/**
 * Client for the self-hosted Music Grabber service. Every /api/* call carries the
 * X-API-Key header (from musicGrabberStore); the base URL is user/env-configured.
 * Search can be slow (multi-source 10-40s), so it uses a generous timeout. All
 * calls throw on non-2xx / network failure so the hook can surface an error.
 */
import { getMusicGrabberUrl, getMusicGrabberKey } from '../../lib/musicGrabberStore';
import type { GrabResult, GrabSearchResponse, GrabJob } from './grabTypes';

const SEARCH_TIMEOUT_MS = 45_000;
const CALL_TIMEOUT_MS = 20_000;

function headers(): Record<string, string> {
  return { 'Content-Type': 'application/json', 'X-API-Key': getMusicGrabberKey() };
}

async function call<T>(path: string, init: RequestInit, timeoutMs: number): Promise<T> {
  const base = getMusicGrabberUrl();
  if (!base) throw new Error('Music Grabber is not configured.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, { ...init, signal: controller.signal });
    if (!res.ok) throw new Error(`Music Grabber ${path} failed (${res.status}).`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Search for a track. Defaults to the fast `youtube` source; pass `source:'all'`
 * for the slower multi-source (lossless-aware) search. */
export async function grabSearch(
  query: string,
  opts: { limit?: number; source?: string } = {},
): Promise<GrabSearchResponse> {
  return call<GrabSearchResponse>(
    '/api/search',
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        query,
        limit: opts.limit ?? 15,
        source: opts.source ?? 'youtube',
      }),
    },
    SEARCH_TIMEOUT_MS,
  );
}

/** Kick off a single-track download for a chosen result. Returns the job to poll. */
export async function grabDownload(result: GrabResult, searchToken: string): Promise<GrabJob> {
  return call<GrabJob>(
    '/api/download',
    {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        video_id: result.video_id,
        title: result.title,
        artist: result.artist ?? result.channel ?? '',
        source: result.source,
        source_url: result.source_url,
        search_token: searchToken,
        download_type: 'single',
        convert_to_flac: true,
        // Only meaningful for Soulseek results; harmless (undefined → omitted).
        slskd_username: result.slskd_username ?? undefined,
        slskd_filename: result.slskd_filename ?? undefined,
        slskd_size: result.slskd_size ?? undefined,
      }),
    },
    CALL_TIMEOUT_MS,
  );
}

/** Fetch a job's current status (poll until isJobDone). */
export async function grabJob(jobId: string): Promise<GrabJob> {
  return call<GrabJob>(
    `/api/jobs/${encodeURIComponent(jobId)}`,
    { method: 'GET', headers: headers() },
    CALL_TIMEOUT_MS,
  );
}
