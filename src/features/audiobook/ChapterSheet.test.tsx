import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('./audiobookApi', () => ({ fetchChapters: vi.fn() }));
// Render IonModal children inline (jsdom can't run the framework delegate).
vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonModal: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
      isOpen ? <div>{children}</div> : null,
  };
});

import { fetchChapters } from './audiobookApi';
import { ChapterSheet } from './ChapterSheet';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const book = { Id: 'b1', Name: 'Book', Type: 'AudioBook' } as JellyfinItem;

const chapters = [
  { name: 'Opening', start: 0 },
  { name: 'Chapter One', start: 60 },
  { name: 'Chapter Two', start: 120 },
];

function render(seek = vi.fn(), position = 70, onClose = vi.fn()) {
  return renderWithProviders(<ChapterSheet open onClose={onClose} />, {
    player: stubPlayer({ current: book, seek }),
    progress: { position, duration: 300 },
  });
}

// jsdom has no layout; stub the auto-scroll-into-view of the active chapter.
Element.prototype.scrollIntoView = vi.fn();

afterEach(() => {
  vi.resetAllMocks();
});

describe('ChapterSheet', () => {
  it('lists the chapters and marks the active one', async () => {
    vi.mocked(fetchChapters).mockResolvedValue(chapters);
    render();
    const rows = await screen.findAllByTestId('chapter-row');
    expect(rows).toHaveLength(3);
    // position 70 → chapter index 1 ("Chapter One") is active.
    expect(rows[1]).toHaveAttribute('aria-current', 'true');
    expect(rows[0]).not.toHaveAttribute('aria-current');
  });

  it('seeks and closes when a chapter is tapped', async () => {
    vi.mocked(fetchChapters).mockResolvedValue(chapters);
    const seek = vi.fn();
    const onClose = vi.fn();
    render(seek, 0, onClose);
    const rows = await screen.findAllByTestId('chapter-row');
    await userEvent.click(rows[2]);
    expect(seek).toHaveBeenCalledWith(120);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an empty state when there are no chapters', async () => {
    vi.mocked(fetchChapters).mockResolvedValue([]);
    render();
    expect(await screen.findByText('No chapters')).toBeInTheDocument();
  });
});
