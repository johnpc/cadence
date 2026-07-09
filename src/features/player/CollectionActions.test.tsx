import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CollectionActions } from './CollectionActions';
import { getPlayContext, setPlayContext } from './playContext';
import { renderWithProviders, stubPlayer } from '../../test/renderWithProviders';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const tracks: JellyfinItem[] = [
  { Id: 'a', Name: 'A', Type: 'Audio' },
  { Id: 'b', Name: 'B', Type: 'Audio' },
];

describe('CollectionActions', () => {
  afterEach(() => setPlayContext(null));

  it('records the "Playing from" context when a labelled collection plays', async () => {
    renderWithProviders(
      <CollectionActions tracks={tracks} context={{ kind: 'playlist', label: 'Chill' }} />,
      { player: stubPlayer({ playQueue: vi.fn() }) },
    );
    await userEvent.click(screen.getByTestId('play-all'));
    const ctx = getPlayContext();
    expect(ctx?.kind).toBe('playlist');
    expect(ctx?.label).toBe('Chill');
    expect([...(ctx?.trackIds ?? [])]).toEqual(['a', 'b']);
  });

  it('leaves the context untouched when no context prop is given', async () => {
    renderWithProviders(<CollectionActions tracks={tracks} />, {
      player: stubPlayer({ playQueue: vi.fn() }),
    });
    await userEvent.click(screen.getByTestId('play-all'));
    expect(getPlayContext()).toBeNull();
  });
  it('plays the collection in order', async () => {
    const playQueue = vi.fn();
    renderWithProviders(<CollectionActions tracks={tracks} />, {
      player: stubPlayer({ playQueue }),
    });
    await userEvent.click(screen.getByTestId('play-all'));
    expect(playQueue).toHaveBeenCalledWith(tracks, 0);
  });

  it('shuffle-plays the collection', async () => {
    const playShuffled = vi.fn();
    renderWithProviders(<CollectionActions tracks={tracks} />, {
      player: stubPlayer({ playShuffled }),
    });
    await userEvent.click(screen.getByTestId('shuffle-all'));
    expect(playShuffled).toHaveBeenCalledWith(tracks);
  });

  it('adds the whole collection to the queue', async () => {
    const addToQueue = vi.fn();
    renderWithProviders(<CollectionActions tracks={tracks} />, {
      player: stubPlayer({ addToQueue }),
    });
    await userEvent.click(screen.getByTestId('queue-all'));
    expect(addToQueue).toHaveBeenCalledWith(tracks);
  });

  it('toggles (pauses) in place when this collection is the active, playing queue', async () => {
    const toggle = vi.fn();
    const playQueue = vi.fn();
    renderWithProviders(<CollectionActions tracks={tracks} />, {
      player: stubPlayer({ queue: tracks, isPlaying: true, toggle, playQueue }),
    });
    const btn = screen.getByTestId('play-all');
    expect(btn).toHaveAttribute('aria-label', 'Pause');
    await userEvent.click(btn);
    expect(toggle).toHaveBeenCalled();
    expect(playQueue).not.toHaveBeenCalled();
  });

  it('resumes (does not restart) when the active queue is paused', async () => {
    const toggle = vi.fn();
    const playQueue = vi.fn();
    renderWithProviders(<CollectionActions tracks={tracks} />, {
      player: stubPlayer({ queue: tracks, isPlaying: false, toggle, playQueue }),
    });
    const btn = screen.getByTestId('play-all');
    expect(btn).toHaveAttribute('aria-label', 'Play');
    await userEvent.click(btn);
    expect(toggle).toHaveBeenCalled();
    expect(playQueue).not.toHaveBeenCalled();
  });
});
