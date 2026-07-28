import { useEffect, useRef } from 'react';
import { buildSnapshot } from './buildSnapshot';
import { pushWidgetSnapshot, hasWidgetBridge } from './widgetBridge';
import { imageUrl } from '../../lib/jellyfinStream';
import { useAudiobookLibrary } from '../audiobook/useAudiobookLibrary';
import { useJumpBackIn } from '../home/useJumpBackIn';

/**
 * Keep the native "Continue listening" widget in sync with what the user would
 * resume: an in-progress audiobook if any, else the most-recent album/playlist/
 * artist they played. Rebuilds the snapshot whenever those inputs change and
 * pushes it to native only when it actually differs (so we don't spam the
 * bridge). Inert off native iOS — the bridge is absent, so nothing is fetched
 * to push and pushWidgetSnapshot no-ops. Mount once, high in the tree.
 */
export function useWidgetSync(): void {
  const native = hasWidgetBridge();
  const { resumable } = useAudiobookLibrary();
  const { items: recents } = useJumpBackIn();
  const lastJson = useRef<string | null>(null);

  useEffect(() => {
    if (!native) return;
    const snapshot = buildSnapshot(resumable, recents, (item) => imageUrl(item, 300));
    const json = JSON.stringify(snapshot);
    if (json === lastJson.current) return;
    lastJson.current = json;
    pushWidgetSnapshot(snapshot);
  }, [native, resumable, recents]);
}
