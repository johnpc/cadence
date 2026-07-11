import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { CardShelf } from './CardShelf';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album: JellyfinItem = { Id: 'al1', Name: 'An Album', Type: 'MusicAlbum' };
const ready = { isLoading: false, isError: false, refetch: vi.fn() };

const renderShelf = (props: Partial<Parameters<typeof CardShelf>[0]> = {}) =>
  render(
    <MemoryRouter>
      <CardShelf
        title="Recently added"
        items={[album]}
        state={ready}
        onOpen={vi.fn()}
        onPlay={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );

describe('CardShelf', () => {
  it('renders its items', () => {
    renderShelf();
    expect(screen.getByText('An Album')).toBeInTheDocument();
  });

  it('hides entirely when loaded empty and hideWhenEmpty is set', () => {
    const { container } = renderShelf({ items: [], hideWhenEmpty: true });
    expect(container).toBeEmptyDOMElement();
  });

  it('still shows the shelf (skeleton path) while an empty result is loading', () => {
    renderShelf({ items: [], hideWhenEmpty: true, state: { ...ready, isLoading: true } });
    expect(screen.getByTestId('shelf')).toBeInTheDocument();
  });

  it('still renders the empty box when hideWhenEmpty is NOT set', () => {
    renderShelf({ items: [] });
    expect(screen.getByTestId('shelf')).toBeInTheDocument();
  });
});
