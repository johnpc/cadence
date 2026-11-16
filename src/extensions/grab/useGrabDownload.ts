import { useState } from 'react';
import { grabDownload } from './grabClient';
import { pollJob } from './pollJob';
import { isJobSuccess, jobId } from './grabTypes';
import { useToast } from '../toast/useToast';
import type { GrabResult } from './grabTypes';

/** Grab a single track: kick off the download, then poll the job to completion,
 * toasting each stage. Tracks which result id is in-flight so the row can show a
 * spinner. Music Grabber rescans the Jellyfin library server-side on completion,
 * so the toast tells the user the track will appear after the next refresh. */
export function useGrabDownload() {
  const toast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);

  const grab = async (result: GrabResult, searchToken: string) => {
    if (busyId) return; // one grab at a time
    setBusyId(result.video_id);
    toast(`Grabbing “${result.title}”…`);
    try {
      const job = await grabDownload(result, searchToken);
      const done = await pollJob(jobId(job));
      if (isJobSuccess(done)) {
        toast('Grabbed — it’ll appear once your library refreshes.');
      } else if (done.status === 'failed') {
        toast('Couldn’t grab that track.');
      } else {
        toast('Still grabbing — check back shortly.');
      }
    } catch {
      toast('Couldn’t start that grab.');
    } finally {
      setBusyId(null);
    }
  };

  return { busyId, grab };
}
