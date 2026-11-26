import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReadAlongBadge } from './ReadAlongBadge';

describe('ReadAlongBadge', () => {
  it('says "Read along" for a ready book', () => {
    render(<ReadAlongBadge status="ready" />);
    const badge = screen.getByTestId('readalong-badge');
    expect(badge).toHaveTextContent('Read along');
    expect(badge).toHaveAttribute('data-status', 'ready');
  });

  it('says "Aligning…" while Storyteller is still syncing', () => {
    render(<ReadAlongBadge status="aligning" />);
    expect(screen.getByTestId('readalong-badge')).toHaveTextContent('Aligning…');
  });

  it('renders nothing for any other status', () => {
    const { container } = render(<ReadAlongBadge status="mismatch" />);
    expect(container).toBeEmptyDOMElement();
  });
});
