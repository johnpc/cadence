import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSwipeUp } from './useSwipeUp';
import { DISMISS_THRESHOLD } from './dismissSwipe';

function Openable({ onOpen }: { onOpen: () => void }) {
  const props = useSwipeUp(onOpen);
  return <div data-testid="target" {...props} />;
}

// jsdom's PointerEvent ignores clientX/Y from fireEvent init; define them.
function pointer(el: Element, type: 'pointerDown' | 'pointerUp', x: number, y: number) {
  const ev = type === 'pointerDown' ? createEvent.pointerDown(el) : createEvent.pointerUp(el);
  Object.defineProperty(ev, 'clientX', { value: x });
  Object.defineProperty(ev, 'clientY', { value: y });
  fireEvent(el, ev);
}

function drag(dx: number, dy: number) {
  const el = screen.getByTestId('target');
  pointer(el, 'pointerDown', 100, 200);
  pointer(el, 'pointerUp', 100 + dx, 200 + dy);
}

describe('useSwipeUp', () => {
  it('fires onOpen for an upward flick', () => {
    const onOpen = vi.fn();
    render(<Openable onOpen={onOpen} />);
    drag(5, -(DISMISS_THRESHOLD + 20));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('does not fire for a downward drag', () => {
    const onOpen = vi.fn();
    render(<Openable onOpen={onOpen} />);
    drag(0, DISMISS_THRESHOLD + 20);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('ignores an orphan pointerup with no pointerdown', () => {
    const onOpen = vi.fn();
    render(<Openable onOpen={onOpen} />);
    pointer(screen.getByTestId('target'), 'pointerUp', 100, 0);
    expect(onOpen).not.toHaveBeenCalled();
  });
});
