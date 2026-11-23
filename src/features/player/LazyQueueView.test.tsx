import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./QueueView', () => ({
  QueueView: ({ open }: { open: boolean }) => (
    <div data-testid="queue-view" data-open={String(open)} />
  ),
}));
import { LazyQueueView } from './LazyQueueView';

describe('LazyQueueView', () => {
  it('loads nothing until first opened', () => {
    render(<LazyQueueView open={false} onClose={vi.fn()} />);
    expect(screen.queryByTestId('queue-view')).toBeNull();
  });

  it('loads the sheet on open and keeps it mounted when it closes again', async () => {
    const { rerender } = render(<LazyQueueView open={false} onClose={vi.fn()} />);
    rerender(<LazyQueueView open onClose={vi.fn()} />);
    expect(await screen.findByTestId('queue-view')).toHaveAttribute('data-open', 'true');
    rerender(<LazyQueueView open={false} onClose={vi.fn()} />);
    expect(screen.getByTestId('queue-view')).toHaveAttribute('data-open', 'false');
  });
});
