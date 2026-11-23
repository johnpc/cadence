import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./LyricsSheet', () => ({
  LyricsSheet: ({ open }: { open: boolean }) => (
    <div data-testid="lyrics-sheet" data-open={String(open)} />
  ),
}));
import { LazyLyricsSheet } from './LazyLyricsSheet';

describe('LazyLyricsSheet', () => {
  it('loads nothing until first opened', () => {
    render(<LazyLyricsSheet open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('lyrics-sheet')).toBeNull();
  });

  it('loads the sheet on open and keeps it mounted when it closes again', async () => {
    const { rerender } = render(<LazyLyricsSheet open={false} onClose={vi.fn()} />);
    rerender(<LazyLyricsSheet open onClose={vi.fn()} />);
    expect(await screen.findByTestId('lyrics-sheet')).toHaveAttribute('data-open', 'true');
    rerender(<LazyLyricsSheet open={false} onClose={vi.fn()} />);
    expect(screen.getByTestId('lyrics-sheet')).toHaveAttribute('data-open', 'false');
  });
});
