import { describe, expect, it } from 'vitest';
import { bookTitle, displayTitle } from './bookTitle';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

const item = (Name: string, Album?: string): JellyfinItem =>
  ({ Id: 'x', Name, Type: 'AudioBook', ...(Album ? { Album } : {}) }) as JellyfinItem;

describe('bookTitle', () => {
  it('prefers a clean Album over a per-chapter Name', () => {
    expect(
      bookTitle(item('1 - Heir of Fire: Opening Credits', 'Heir of Fire (Unabridged)'), 1),
    ).toBe('Heir of Fire');
  });

  it('strips a leading track number from the Album ("01 Blade Runner")', () => {
    expect(bookTitle(item('Blade Runner', '01 Blade Runner'), 1)).toBe('Blade Runner');
  });

  it('strips a leading track number from both Name and Album ("01 The Stranger")', () => {
    expect(bookTitle(item('01 The Stranger', '01 The Stranger'), 1)).toBe('The Stranger');
  });

  it('strips trailing (Unabridged)', () => {
    expect(bookTitle(item('Circe (Unabridged)', 'Circe (Unabridged)'), 1)).toBe('Circe');
  });

  it('keeps a legitimately numeric title ("1984")', () => {
    expect(bookTitle(item('1984', '1984'), 1)).toBe('1984');
  });

  it('keeps the Name when the Album is only a bare number ("451")', () => {
    expect(bookTitle(item('Fahrenheit 451', '451'), 1)).toBe('Fahrenheit 451');
  });

  it('strips a part suffix from a multi-part Name that has no Album', () => {
    expect(bookTitle(item('Home Front-Part01'), 3)).toBe('Home Front');
  });

  it('falls back to the raw Name when everything cleans to empty', () => {
    expect(bookTitle(item('01'), 1)).toBe('01');
  });
});

describe('displayTitle', () => {
  it.each([
    ['The Institute - A Novel', 'The Institute'],
    ['Baby Teeth: A Novel', 'Baby Teeth'],
    ['A Gentleman in Moscow (Unabridged)', 'A Gentleman in Moscow'],
    ['George Orwell’s 1984 [B0CRRP4WW7]', 'George Orwell’s 1984'],
    ['Abundance (2025) [V2]', 'Abundance (2025)'],
    ['A Novel', 'A Novel'],
    ['Circe', 'Circe'],
  ])('%s → %s', (raw, shown) => {
    expect(displayTitle(raw)).toBe(shown);
  });
});
