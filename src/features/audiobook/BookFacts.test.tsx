import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BookFacts } from './BookFacts';
import type { Book } from './groupBooks';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = (over: Partial<JellyfinItem>): Book => ({
  id: 'b',
  title: 'Dune',
  book: { Id: 'b', Name: 'Dune', Type: 'AudioBook', ...over } as JellyfinItem,
  parts: [{ Id: 'b', Name: 'Dune', Type: 'AudioBook', ...over } as JellyfinItem],
});

describe('BookFacts', () => {
  it('renders a labelled fact for each known detail', () => {
    render(<BookFacts book={book({ ProductionYear: 1965 })} />);
    expect(screen.getByTestId('book-facts')).toBeInTheDocument();
    expect(screen.getByText('Year')).toBeInTheDocument();
    expect(screen.getByText('1965')).toBeInTheDocument();
  });

  it('always has at least the parts fact, so it renders', () => {
    render(<BookFacts book={book({})} />);
    expect(screen.getAllByTestId('book-fact').length).toBeGreaterThan(0);
  });
});
