import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BookProgressBars } from './BookProgressBars';

const book = { title: 'Harbor Winds', position: 250, duration: 900, remainingAtRate: 650 };

describe('BookProgressBars', () => {
  it('shows a labelled chapter bar over a labelled book bar; each seeks in book seconds', () => {
    const onSeekBook = vi.fn();
    render(
      <BookProgressBars
        model={{
          book,
          chapter: {
            title: 'Part 2 of 3',
            position: 50,
            duration: 300,
            remainingAtRate: 250,
            start: 200,
            index: 1,
            count: 3,
          },
        }}
        rate={1}
        onSeekBook={onSeekBook}
      />,
    );
    expect(screen.getByTestId('chapter-progress-label')).toHaveTextContent('Part 2 of 3');
    expect(screen.getByTestId('chapter-progress-time')).toHaveTextContent('0:50 / 5:00');
    expect(screen.getByTestId('book-progress-label')).toHaveTextContent('Harbor Winds');
    expect(screen.getByTestId('book-progress-time')).toHaveTextContent('4:10 / 15:00 · 11m left');
    const [chapterBar, bookBar] = screen.getAllByRole('slider');
    fireEvent.change(chapterBar, { target: { value: '120' } });
    fireEvent.pointerUp(chapterBar);
    expect(onSeekBook).toHaveBeenLastCalledWith(320);
    fireEvent.change(bookBar, { target: { value: '700' } });
    fireEvent.keyUp(bookBar);
    expect(onSeekBook).toHaveBeenLastCalledWith(700);
  });

  it('shows only the book bar (as the primary) when there are no chapters, with a test prefix', () => {
    render(
      <BookProgressBars
        model={{ book, chapter: null }}
        rate={2}
        testPrefix="readalong-"
        onSeekBook={vi.fn()}
      />,
    );
    expect(screen.queryByTestId('readalong-chapter-progress')).toBeNull();
    expect(screen.getByTestId('readalong-book-progress')).toHaveClass('progress-row--primary');
    expect(screen.getByTestId('readalong-book-progress-time')).toHaveTextContent('· 5m left');
  });

  it('a drag shows the target, and a blur without a drag does not seek', () => {
    const onSeekBook = vi.fn();
    render(<BookProgressBars model={{ book, chapter: null }} rate={1} onSeekBook={onSeekBook} />);
    const bar = screen.getByRole('slider');
    fireEvent.blur(bar);
    expect(onSeekBook).not.toHaveBeenCalled();
    fireEvent.change(bar, { target: { value: '3700' } });
    expect(screen.getByTestId('book-progress-time')).toHaveTextContent('15:00 / 15:00');
  });
});
