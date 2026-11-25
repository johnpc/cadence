import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./ChapterSheet', () => ({
  ChapterSheet: ({ open }: { open: boolean }) => (
    <div data-testid="chapter-sheet" data-open={String(open)} />
  ),
}));
import { LazyChapterSheet } from './LazyChapterSheet';

describe('LazyChapterSheet', () => {
  it('loads nothing until first opened', () => {
    render(<LazyChapterSheet open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('chapter-sheet')).toBeNull();
  });

  it('loads the sheet on open and keeps it mounted when it closes again', async () => {
    const { rerender } = render(<LazyChapterSheet open={false} onClose={vi.fn()} />);
    rerender(<LazyChapterSheet open onClose={vi.fn()} />);
    expect(await screen.findByTestId('chapter-sheet')).toHaveAttribute('data-open', 'true');
    rerender(<LazyChapterSheet open={false} onClose={vi.fn()} />);
    expect(screen.getByTestId('chapter-sheet')).toHaveAttribute('data-open', 'false');
  });
});
