import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ResultRow } from './ResultRow';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album: JellyfinItem = { Id: 'al', Name: 'An Album', Type: 'MusicAlbum' };

it('renders the item and calls onSelect when tapped', async () => {
  const onSelect = vi.fn();
  render(<ResultRow item={album} subtitle="Artist X" onSelect={onSelect} />);
  expect(screen.getByText('An Album')).toBeInTheDocument();
  expect(screen.getByText('Artist X')).toBeInTheDocument();
  await userEvent.click(screen.getByTestId('result-row'));
  expect(onSelect).toHaveBeenCalledWith(album);
});
