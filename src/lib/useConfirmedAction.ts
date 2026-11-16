import { useCallback, useRef, useState } from 'react';

/** A confirm-then-run action's ONE state: nothing pending, the confirm dialog
 * showing, or the action running (button disabled, "…ing" label). */
export type ConfirmPhase = 'idle' | 'confirming' | 'running';

/**
 * Drives a destructive button guarded by a confirm dialog. The dialog's confirm
 * handler fires BEFORE its `onDidDismiss`, so `dismissed` only returns to idle
 * from `confirming` — it never clobbers the `running` state it just started.
 * A second `run` while one is running is ignored.
 */
export function useConfirmedAction(action: () => Promise<void>) {
  const [phase, setPhase] = useState<ConfirmPhase>('idle');
  const running = useRef(false);
  const ask = useCallback(() => setPhase((p) => (p === 'idle' ? 'confirming' : p)), []);
  const dismissed = useCallback(() => setPhase((p) => (p === 'confirming' ? 'idle' : p)), []);
  const run = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    setPhase('running');
    try {
      await action();
    } finally {
      running.current = false;
      setPhase('idle');
    }
  }, [action]);
  return { phase, ask, dismissed, run };
}
