import { useEffect, useState } from 'react';

/**
 * Lets the user dismiss the mini-player to browse without it in the way. Dismissal
 * is per-track: it hides the bar (playback keeps going) but the bar returns on its
 * own the moment a NEW track starts, so playing something always brings it back —
 * no stranded "where did my player go" state. Returns whether to hide, plus a
 * `dismiss` action for the close button.
 */
export function useNowPlayingDismiss(currentId: string | undefined): {
  dismissed: boolean;
  dismiss: () => void;
} {
  const [dismissedId, setDismissedId] = useState<string | undefined>(undefined);
  // A new track un-dismisses (clear the latch when the id no longer matches).
  useEffect(() => {
    setDismissedId((d) => (d === currentId ? d : undefined));
  }, [currentId]);
  return {
    dismissed: !!currentId && dismissedId === currentId,
    dismiss: () => setDismissedId(currentId),
  };
}
