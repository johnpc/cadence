import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GradientHeader } from './GradientHeader';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const album: JellyfinItem = {
  Id: 'al1',
  Name: 'Album',
  Type: 'MusicAlbum',
  ImageTags: { Primary: 'x' },
};

describe('GradientHeader', () => {
  it('renders its children inside the header wrapper', () => {
    render(
      <GradientHeader item={album}>
        <p>Header content</p>
      </GradientHeader>,
    );
    expect(screen.getByTestId('gradient-header')).toBeInTheDocument();
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('renders children even when the item is null (no art to sample)', () => {
    render(
      <GradientHeader item={null}>
        <p>No art</p>
      </GradientHeader>,
    );
    expect(screen.getByText('No art')).toBeInTheDocument();
  });
});
