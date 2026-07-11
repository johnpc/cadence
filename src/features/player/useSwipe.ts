import { useRef } from 'react';
import { swipeAction } from './swipeAction';

/** Pointer-based horizontal swipe detection. Returns props to spread onto an
 * element; a left/right swipe past the threshold fires onNext/onPrev once on
 * release. Uses pointer events so it works for touch and mouse alike. */
export function useSwipe(onNext: () => void, onPrev: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const action = swipeAction(e.clientX - s.x, e.clientY - s.y);
      if (action === 'next') onNext();
      else if (action === 'prev') onPrev();
    },
  };
}
