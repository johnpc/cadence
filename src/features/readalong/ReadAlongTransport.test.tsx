import { fireEvent, render, screen } from '@testing-library/react';
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
    progress: null,
    rate: 1,
    onToggle: vi.fn(),
    onSeek: vi.fn(),
    onSeekBook: vi.fn(),
    onRate: vi.fn(),
    onAct: vi.fn(),
    ...over,
  };
  render(<ReadAlongTransport {...props} />);
  return props;
}

describe('ReadAlongTransport', () => {
  it('pauses and skips 30 s either way — each action re-follows the narration', async () => {
    const p = setup();
    expect(screen.queryByTestId('readalong-book-progress')).toBeNull();
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

  it('shows chapter and whole-book progress, labelled, with readable times; the chapter bar seeks from the chapter start', async () => {
    const progress = {
      book: { title: 'Hogfather', position: 3796, duration: 37104, remainingAtRate: 33308 },
      chapter: {
        title: 'Chapter 4',
        position: 196,
        duration: 1458,
        remainingAtRate: 1262,
        start: 3600,
        index: 3,
        count: 114,
      },
    };
    const p = setup({ progress });
    expect(screen.getByTestId('readalong-chapter-progress-label')).toHaveTextContent('Chapter 4');
    expect(screen.getByTestId('readalong-chapter-progress-time')).toHaveTextContent('3:16 / 24:18');
    expect(screen.getByTestId('readalong-book-progress-label')).toHaveTextContent('Hogfather');
    expect(screen.getByTestId('readalong-book-progress-time')).toHaveTextContent(
      '1:03:16 / 10:18:24 · 9h 15m left',
    );
    const [chapterBar] = screen.getAllByRole('slider');
    fireEvent.change(chapterBar, { target: { value: '100' } });
    fireEvent.pointerUp(chapterBar);
    expect(p.onSeekBook).toHaveBeenLastCalledWith(3700);
    expect(p.onAct).toHaveBeenCalled();
  });

  it('sets the speed from the pill without leaving the sheet', async () => {
    const p = setup({ rate: 1 });
    expect(screen.getByTestId('readalong-speed')).toHaveTextContent('1×');
    await userEvent.click(screen.getByTestId('readalong-speed'));
    const options = screen.getAllByTestId('readalong-speed-option');
    await userEvent.click(options.find((o) => o.textContent === '1.5×')!);
    expect(p.onRate).toHaveBeenCalledWith(1.5);
    expect(p.onAct).toHaveBeenCalledTimes(1);
    expect(screen.queryAllByTestId('readalong-speed-option')).toHaveLength(0);
  });
});
