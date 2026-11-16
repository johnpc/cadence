import { useCallback, useState } from 'react';
import { useToast } from '../toast/useToast';
import { importDeezerPlaylist } from './deezerApi';
import { requestMissingArtist } from './requestMissingArtist';
import type { DeezerImportResult, MissingStatus } from './deezerTypes';

/** Drives the Deezer import screen: run the import, hold the result, and let the
 * user request each missing artist via Lidarr (by name, since Deezer only gives
 * us names). Import status and per-artist request status are tracked separately
 * so the UI can show a spinner on the button and on each missing-artist row. */
export function useDeezerImport() {
  const toast = useToast();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<DeezerImportResult | null>(null);
  const [status, setStatus] = useState<Record<string, MissingStatus>>({});

  const runImport = useCallback(
    async (raw: string) => {
      setImporting(true);
      setStatus({});
      try {
        const res = await importDeezerPlaylist(raw);
        setResult(res);
        toast(`Imported ${res.AddedCount} of ${res.TotalCount} tracks into “${res.PlaylistName}”`);
      } catch (e) {
        setResult(null);
        toast(e instanceof Error ? e.message : 'Import failed');
      } finally {
        setImporting(false);
      }
    },
    [toast],
  );

  const request = useCallback(
    async (artist: string) => {
      setStatus((s) => ({ ...s, [artist]: 'requesting' }));
      try {
        await requestMissingArtist(artist);
        setStatus((s) => ({ ...s, [artist]: 'requested' }));
        toast(`Requested ${artist} — downloading soon`);
      } catch {
        setStatus((s) => ({ ...s, [artist]: 'error' }));
        toast(`Couldn’t request ${artist}`);
      }
    },
    [toast],
  );

  return { importing, result, status, runImport, request };
}
