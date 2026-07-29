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
  const { highlights } = useAudiobookLibrary();
  const { items: recents } = useJumpBackIn();
  const lastJson = useRef<string | null>(null);

  useEffect(() => {
    if (!native) return;
    // highlights are in-progress/favorite audiobooks (resumable first) — the
    // widget's preferred "continue listening" candidate, else a recent collection.
    const snapshot = buildSnapshot(highlights, recents, (item) => imageUrl(item, 300));
    const json = JSON.stringify(snapshot);
    if (json === lastJson.current) return;
    lastJson.current = json;
    pushWidgetSnapshot(snapshot);
  }, [native, highlights, recents]);
}
