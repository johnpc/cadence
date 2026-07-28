import { useSyncExternalStore } from 'react';
import { getProgress, onProgressChange } from './downloadProgress';

/**
 * A single track's live download fraction (0..1), or undefined when it isn't
 * currently downloading. Subscribes to the ephemeral progress store so a row's
 * badge/percent updates as bytes arrive, without threading state through props.
 */
export function useDownloadProgress(id: string): number | undefined {
  return useSyncExternalStore(
    onProgressChange,
    () => getProgress(id),
    () => undefined,
  );
}
