import { render, screen, fireEvent, createEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useSwipe } from './useSwipe';
import { SWIPE_THRESHOLD } from './swipeAction';

function Swipeable({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const swipe = useSwipe(onNext, onPrev);
  return <div data-testid="target" {...swipe} />;
}

// jsdom's PointerEvent ignores clientX/clientY from fireEvent init, so define
// them on the event before dispatch — React then surfaces them to the handler.
function pointer(el: Element, type: 'pointerDown' | 'pointerUp', x: number, y: number) {
  const ev = type === 'pointerDown' ? createEvent.pointerDown(el) : createEvent.pointerUp(el);
  Object.defineProperty(ev, 'clientX', { value: x });
  Object.defineProperty(ev, 'clientY', { value: y });
  fireEvent(el, ev);
}

function swipe(dx: number, dy = 0) {
  const el = screen.getByTestId('target');
  pointer(el, 'pointerDown', 100, 100);
  pointer(el, 'pointerUp', 100 + dx, 100 + dy);
}

describe('useSwipe', () => {
  it('fires onNext for a left swipe', () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(<Swipeable onNext={onNext} onPrev={onPrev} />);
    swipe(-(SWIPE_THRESHOLD + 20));
    expect(onNext).toHaveBeenCalledOnce();
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('fires onPrev for a right swipe', () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(<Swipeable onNext={onNext} onPrev={onPrev} />);
    swipe(SWIPE_THRESHOLD + 20);
    expect(onPrev).toHaveBeenCalledOnce();
  });

  it('does nothing for a tap (no movement)', () => {
    const onNext = vi.fn();
    const onPrev = vi.fn();
    render(<Swipeable onNext={onNext} onPrev={onPrev} />);
    swipe(0);
    expect(onNext).not.toHaveBeenCalled();
    expect(onPrev).not.toHaveBeenCalled();
  });

  it('ignores a pointerup with no matching pointerdown', () => {
    const onNext = vi.fn();
    render(<Swipeable onNext={onNext} onPrev={vi.fn()} />);
    pointer(screen.getByTestId('target'), 'pointerUp', 0, 100);
    expect(onNext).not.toHaveBeenCalled();
  });
});
