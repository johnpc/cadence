/**
 * Types for the Music Grabber API (v3.0.3) — the self-hosted service that grabs
 * a single track into the Jellyfin library. Hand-modelled to just the fields the
 * Grab feature consumes (no `any`).
 */

/** One search result. Pre-ranked by `quality_score` (higher = better; lossless
 * floats to the top). `is_playlist` results are filtered out of the single-track
 * UX. slskd_* fields are only present for Soulseek-sourced results. */
export interface GrabResult {
  video_id: string;
  title: string;
  channel: string | null;
  artist: string | null;
  duration: number | null;
  thumbnail: string | null;
  source: string;
  source_url: string;
  quality_score: number;
  is_playlist: boolean;
  album: string | null;
  slskd_username?: string | null;
  slskd_filename?: string | null;
  slskd_size?: number | null;
}

/** POST /api/search response. */
export interface GrabSearchResponse {
  results: GrabResult[];
  slskd_enabled: boolean;
  search_token: string;
  unavailable_sources?: string[];
  duplicate_notice?: string | null;
}

/** A download job. The POST /api/download response uses `job_id`; the GET
 * /api/jobs/{id} response uses `id` — so both are optional and jobId() reads
 * whichever is present. Terminal status is `completed`/`failed` (verified live —
 * NOT `complete`); anything else is in-progress. */
export interface GrabJob {
  job_id?: string;
  id?: string;
  status: string;
  title?: string;
  error?: string | null;
  progress?: number | null;
}

/** The job's id, from whichever field the endpoint used. */
export function jobId(job: GrabJob): string {
  return job.job_id ?? job.id ?? '';
}

/** Whether a job has reached a terminal state. */
export function isJobDone(job: GrabJob): boolean {
  return job.status === 'completed' || job.status === 'failed';
}

/** Whether a terminal job succeeded. */
export function isJobSuccess(job: GrabJob): boolean {
  return job.status === 'completed';
}
