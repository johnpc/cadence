import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@ionic/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ionic/react')>();
  return {
    ...actual,
    IonModal: ({ isOpen, children }: { isOpen: boolean; children: ReactNode }) =>
      isOpen ? <div>{children}</div> : null,
  };
});
vi.mock('./useReadAlong', () => ({ useReadAlongBook: vi.fn(), useChapterText: vi.fn() }));
vi.mock('../player/pendingSeek', () => ({ setPendingSeek: vi.fn() }));
vi.mock('../audiobook/useChapters', () => ({
  useChapters: vi.fn(() => ({ chapters: [], isLoading: false })),
}));
vi.mock('../../lib/haptics', () => ({ tap: vi.fn() }));
import { useChapterText, useReadAlongBook } from './useReadAlong';
import { setPendingSeek } from '../player/pendingSeek';
import { useChapters } from '../audiobook/useChapters';
import { ReadAlongSheet } from './ReadAlongSheet';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { ReadAlongBook } from './storytellerApi';

const part1: JellyfinItem = {
  Id: 'p1',
  Name: 'Harbor Winds',
  Type: 'AudioBook',
  Album: 'Harbor Winds',
};
const part2: JellyfinItem = {
  Id: 'p2',
  Name: 'Harbor Winds',
  Type: 'AudioBook',
  Album: 'Harbor Winds',
};

const readyBook: ReadAlongBook = {
  Status: 'ready',
  BookUuid: 'u',
  Title: 'Harbor Winds',
  Duration: 200,
  Parts: [
    { ItemId: 'p1', Duration: 100 },
    { ItemId: 'p2', Duration: 100 },
  ],
  Chapters: [{ Href: 'ch1.xhtml', Title: 'Chapter One' }],
  Clips: [
    { Start: 0, End: 4, Chapter: 0, Fragment: 's1' },
    { Start: 4, End: 8, Chapter: 0, Fragment: 's2' },
    { Start: 150, End: 154, Chapter: 0, Fragment: 's3' },
  ],
};

const chapterHtml =
  '<p id="s1">First sentence.</p><p id="s2">Second sentence.</p><p id="s3">Third sentence.</p>' +
  '<script>window.__xss = 1</script>';

function mockBook(
  book: ReadAlongBook | undefined,
  extra: Partial<ReturnType<typeof useReadAlongBook>> = {},
) {
  vi.mocked(useReadAlongBook).mockReturnValue({
    book,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
    ...extra,
  } as ReturnType<typeof useReadAlongBook>);
}

function mockText(html: string | undefined) {
  vi.mocked(useChapterText).mockReturnValue({
    html,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as ReturnType<typeof useChapterText>);
}

describe('ReadAlongSheet', () => {
  beforeEach(() => {
    window.__CADENCE_CONFIG__ = { storyteller: true };
    Element.prototype.scrollIntoView = vi.fn();
    vi.mocked(useChapters).mockReturnValue({ chapters: [], isLoading: false });
    mockText(chapterHtml);
  });
  afterEach(() => {
    delete window.__CADENCE_CONFIG__;
    vi.resetAllMocks();
  });

  it('highlights the sentence being narrated and strips scripts from the chapter', async () => {
    mockBook(readyBook);
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: part1, queue: [part1, part2] }),
      progress: { position: 5, duration: 100 },
    });
    const text = await screen.findByTestId('readalong-text');
    await waitFor(() => expect(text.querySelector('[data-active="true"]')?.id).toBe('s2'));
    expect(text.querySelector('script')).toBeNull();
    expect((window as unknown as { __xss?: number }).__xss).toBeUndefined();
    expect(screen.getByTestId('readalong-chapter')).toHaveTextContent('Chapter One');
  });

  it('keeps the highlight across re-renders and moves it as the narration advances', async () => {
    mockBook(readyBook);
    const player = stubPlayer({ current: part1, queue: [part1, part2] });
    const view = renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player,
      progress: { position: 1, duration: 100 },
    });
    const text = await screen.findByTestId('readalong-text');
    await waitFor(() => expect(text.querySelector('[data-active="true"]')?.id).toBe('s1'));
    // A progress tick inside the same sentence re-renders the sheet: the
    // highlight must survive it (it used to be wiped by a markup re-apply).
    view.rerender(<ReadAlongSheet open onClose={vi.fn()} />);
    expect(text.querySelector('[data-active="true"]')?.id).toBe('s1');
    expect(text.querySelectorAll('[data-active="true"]')).toHaveLength(1);
  });

  it('lifts the position of a later part onto the book clock', async () => {
    mockBook(readyBook);
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: part2, queue: [part1, part2] }),
      progress: { position: 51, duration: 100 },
    });
    const text = await screen.findByTestId('readalong-text');
    await waitFor(() => expect(text.querySelector('[data-active="true"]')?.id).toBe('s3'));
  });

  it('seeks within the part when a sentence is tapped', async () => {
    mockBook(readyBook);
    const seek = vi.fn();
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: part1, queue: [part1, part2], seek }),
      progress: { position: 1, duration: 100 },
    });
    await userEvent.click(await screen.findByText('Second sentence.'));
    expect(seek).toHaveBeenCalledWith(4);
  });

  it('jumps the queue to another part (with a pending seek) when the sentence lives there', async () => {
    mockBook(readyBook);
    const jumpTo = vi.fn();
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: part1, queue: [part1, part2], jumpTo }),
      progress: { position: 1, duration: 100 },
    });
    await userEvent.click(await screen.findByText('Third sentence.'));
    expect(setPendingSeek).toHaveBeenCalledWith('p2', 50);
    expect(jumpTo).toHaveBeenCalledWith(1);
  });

  it('detaches when the reader scrolls and re-follows from the chip', async () => {
    mockBook(readyBook);
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: part1, queue: [part1, part2] }),
      progress: { position: 5, duration: 100 },
    });
    const text = await screen.findByTestId('readalong-text');
    expect(screen.queryByTestId('readalong-follow')).toBeNull();
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.wheel(text);
    const chip = await screen.findByTestId('readalong-follow');
    await userEvent.click(chip);
    expect(screen.queryByTestId('readalong-follow')).toBeNull();
  });

  it('explains that the server setup is unfinished for an account Storyteller does not know', async () => {
    mockBook({ ...readyBook, Status: 'unlinked', Clips: [] });
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: part1 }),
    });
    const box = await screen.findByTestId('readalong-unavailable');
    expect(box).toHaveAttribute('data-reason', 'unlinked');
    expect(screen.getByText("Storyteller isn't ready for your account")).toBeInTheDocument();
    expect(screen.getByText(/Ask whoever runs your server/)).toBeInTheDocument();
    // Nothing for the listener to do in-app: no link, no setting.
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('shows the aligning / unmatched / mismatch copy', async () => {
    mockBook({ ...readyBook, Status: 'aligning', Clips: [] });
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: part1 }),
    });
    expect(await screen.findByText(/still aligning/)).toBeInTheDocument();
  });

  it('explains an alignment with no sentence timing and how to fix it', async () => {
    mockBook({ ...readyBook, Status: 'empty', Clips: [] });
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: part1 }),
    });
    expect(await screen.findByText('No narration timing')).toBeInTheDocument();
    expect(screen.getByText(/Re-pair it with the matching ebook/)).toBeInTheDocument();
    expect(screen.getByTestId('readalong-unavailable')).toHaveAttribute('data-reason', 'empty');
  });

  it('marks the upcoming sentence and counts down during a silent stretch', async () => {
    mockBook({ ...readyBook, Clips: [{ Start: 42, End: 46, Chapter: 0, Fragment: 's2' }] });
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: part1, queue: [part1, part2] }),
      progress: { position: 0, duration: 100 },
    });
    const text = await screen.findByTestId('readalong-text');
    await waitFor(() => expect(text.querySelector('[data-upcoming="true"]')?.id).toBe('s2'));
    expect(text.querySelector('[data-active="true"]')).toBeNull();
    expect(screen.getByTestId('readalong-chapter')).toHaveTextContent('Narration starts in 0:42');
  });

  it('is unavailable for music even when the feature is on', async () => {
    mockBook(undefined);
    const song: JellyfinItem = { Id: 's', Name: 'Song', Type: 'Audio' };
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: song }),
    });
    expect(await screen.findByTestId('readalong-unavailable')).toHaveAttribute(
      'data-reason',
      'not-a-book',
    );
  });

  it('shows an error with retry when the book lookup fails', async () => {
    const refetch = vi.fn();
    mockBook(undefined, { isError: true, refetch });
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: part1 }),
    });
    await userEvent.click(await screen.findByRole('button', { name: /retry|try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it('shows a loading state while the book is fetched', async () => {
    mockBook(undefined, { isLoading: true });
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player: stubPlayer({ current: part1 }),
    });
    expect(await screen.findByTestId('load-loading')).toBeInTheDocument();
  });

  it("names the audiobook's own chapter with time left, and the transport seeks and pauses without leaving", async () => {
    vi.mocked(useChapters).mockReturnValue({
      chapters: [
        { name: 'Dedication', start: 0 },
        { name: 'Chapter 1', start: 60 },
      ],
      isLoading: false,
    });
    mockBook(readyBook);
    const player = stubPlayer({ current: part1, queue: [part1, part2], isPlaying: true });
    renderWithProviders(<ReadAlongSheet open onClose={vi.fn()} />, {
      player,
      progress: { position: 5, duration: 100 },
    });
    await screen.findByTestId('readalong-text');
    expect(screen.getByTestId('readalong-chapter')).toHaveTextContent('Dedication · 55s left');
    expect(screen.getByTestId('readalong-chapter-progress-label')).toHaveTextContent('Dedication');
    expect(screen.getByTestId('readalong-chapter-progress-time')).toHaveTextContent('0:05 / 1:00');
    expect(screen.getByTestId('readalong-book-progress-label')).toHaveTextContent('Harbor Winds');
    expect(screen.getByTestId('readalong-book-progress-time')).toHaveTextContent('0:05 / 1:40');
    await userEvent.click(screen.getByTestId('readalong-speed'));
    await userEvent.click(
      screen.getAllByTestId('readalong-speed-option').find((o) => o.textContent === '2×')!,
    );
    expect(player.setRate).toHaveBeenCalledWith(2);
    await userEvent.click(screen.getByTestId('readalong-forward'));
    expect(player.seek).toHaveBeenLastCalledWith(35);
    await userEvent.click(screen.getByTestId('readalong-next-chapter'));
    expect(player.seek).toHaveBeenLastCalledWith(60);
    await userEvent.click(screen.getByTestId('readalong-toggle'));
    expect(player.toggle).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('readalong-sheet')).toBeInTheDocument();
  });
});
