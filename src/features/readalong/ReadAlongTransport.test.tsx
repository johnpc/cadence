import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ReadAlongTransport } from './ReadAlongTransport';

const chapters = [
  { name: 'Dedication', start: 0 },
  { name: 'Chapter 1', start: 168 },
  { name: 'Chapter 2', start: 900 },
];

function setup(over: Partial<Parameters<typeof ReadAlongTransport>[0]> = {}) {
  const props = {
    isPlaying: true,
    position: 500,
    duration: 3700,
    chapters,
    onToggle: vi.fn(),
    onSeek: vi.fn(),
    onAct: vi.fn(),
    ...over,
  };
  render(<ReadAlongTransport {...props} />);
  return props;
}

describe('ReadAlongTransport', () => {
  it('shows the time, pauses, and skips 30 s either way — each action re-follows the narration', async () => {
    const p = setup();
    expect(screen.getByTestId('readalong-time')).toHaveTextContent('8:20 / 61:40');
    expect(screen.getByTestId('readalong-toggle')).toHaveAttribute('aria-label', 'Pause');
    await userEvent.click(screen.getByTestId('readalong-toggle'));
    expect(p.onToggle).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByTestId('readalong-back'));
    expect(p.onSeek).toHaveBeenLastCalledWith(470);
    await userEvent.click(screen.getByTestId('readalong-forward'));
    expect(p.onSeek).toHaveBeenLastCalledWith(530);
    expect(p.onAct).toHaveBeenCalledTimes(3);
  });

  it('jumps between chapters by the markers', async () => {
    const p = setup();
    await userEvent.click(screen.getByTestId('readalong-prev-chapter'));
    expect(p.onSeek).toHaveBeenLastCalledWith(168);
    await userEvent.click(screen.getByTestId('readalong-next-chapter'));
    expect(p.onSeek).toHaveBeenLastCalledWith(900);
  });

  it('hides the chapter buttons when the file has no chapter markers, and shows Play when paused', () => {
    setup({ chapters: [], isPlaying: false });
    expect(screen.queryByTestId('readalong-prev-chapter')).toBeNull();
    expect(screen.queryByTestId('readalong-next-chapter')).toBeNull();
    expect(screen.getByTestId('readalong-toggle')).toHaveAttribute('aria-label', 'Play');
  });

  it('never seeks past the end or before the start', async () => {
    const p = setup({ position: 10, duration: 20 });
    await userEvent.click(screen.getByTestId('readalong-back'));
    expect(p.onSeek).toHaveBeenLastCalledWith(0);
    await userEvent.click(screen.getByTestId('readalong-forward'));
    expect(p.onSeek).toHaveBeenLastCalledWith(20);
  });
});
