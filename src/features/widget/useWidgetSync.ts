import { useEffect, useRef } from 'react';
import { buildSnapshot } from './buildSnapshot';
import { pushWidgetSnapshot, hasWidgetBridge } from './widgetBridge';
import { imageUrl } from '../../lib/jellyfinStream';
import { useAudiobookHighlights } from '../audiobook/useAudiobookLibrary';
import { useJumpBackIn } from '../home/useJumpBackIn';

/**
 * Keep the native "Continue listening" widget in sync with what the user would
 * resume: an in-progress audiobook if any, else the most-recent album/playlist/
 * artist they played. Rebuilds the snapshot whenever those inputs change and
 * pushes it to native only when it actually differs (so we don't spam the
 * bridge). Inert off native iOS — the bridge is absent, so the audiobook
 * highlight queries are DISABLED (no fetch) and pushWidgetSnapshot no-ops. This
 * hook mounts app-wide, so it must not fetch on web. Mount once, high in the tree.
 */
export function useWidgetSync(): void {
  const native = hasWidgetBridge();
  // Only the resume candidate (small bounded queries), and only on native — never
  // the full audiobook-library scan, which used to run on every screen via here.
  const highlights = useAudiobookHighlights(native);
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
