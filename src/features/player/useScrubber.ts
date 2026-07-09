import { useState } from 'react';

/**
 * Drag-to-seek behaviour shared by the mini-bar and full-player scrubbers.
 * While the user drags, we show the dragged value (not the still-advancing
 * playback position) and DON'T seek on every step — a range input fires an
 * event per pixel, and seeking on each one is janky and hammers the audio
 * element. We commit a single seek when the drag ends (pointer/key up or the
 * native change event).
 */
export function useScrubber(position: number, seek: (seconds: number) => void) {
  const [dragValue, setDragValue] = useState<number | null>(null);

  const value = dragValue ?? position;

  return {
    /** The value the slider should show: the drag target, else live position. */
    value,
    /** Fires per drag step — track the target locally, don't seek yet. */
    onInput: (v: number) => setDragValue(v),
    /** Commit the seek and stop showing the drag value. */
    onCommit: () => {
      if (dragValue !== null) seek(dragValue);
      setDragValue(null);
    },
  };
}
