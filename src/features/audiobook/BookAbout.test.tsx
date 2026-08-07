import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { BookAbout } from './BookAbout';

const long = 'word '.repeat(100).trim(); // 499 chars, well over the preview limit

describe('BookAbout', () => {
  it('renders nothing without a description', () => {
    const { container } = render(<BookAbout overview={undefined} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows short text with no toggle', () => {
    render(<BookAbout overview="A brief blurb." />);
    expect(screen.getByTestId('book-about')).toHaveTextContent('A brief blurb.');
    expect(screen.queryByTestId('book-about-toggle')).toBeNull();
  });

  it('truncates long text and expands / collapses on the toggle', async () => {
    render(<BookAbout overview={long} />);
    const para = screen.getByTestId('book-about').querySelector('p')!;
    expect(para.textContent!.endsWith('…')).toBe(true);
    expect(para.textContent!.length).toBeLessThan(long.length);

    await userEvent.click(screen.getByTestId('book-about-toggle'));
    expect(screen.getByTestId('book-about').querySelector('p')!.textContent).toBe(long);
    expect(screen.getByTestId('book-about-toggle')).toHaveTextContent('Show less');

    await userEvent.click(screen.getByTestId('book-about-toggle'));
    expect(screen.getByTestId('book-about').querySelector('p')!.textContent!.endsWith('…')).toBe(
      true,
    );
  });
});
