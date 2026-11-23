// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { decodeEntities, genreChips, genreLabel } from './genreLabels';

describe('genreLabels', () => {
  it('labels a category path by its most specific segment, decoding entities', () => {
    expect(genreLabel('SCIENCE FICTION &amp; FANTASY:FANTASY:MYTHS &amp; LEGENDS')).toBe(
      'MYTHS & LEGENDS',
    );
    expect(genreLabel('Rock')).toBe('Rock');
    expect(genreLabel('Fiction: ')).toBe('Fiction');
    expect(genreLabel(' : ')).toBe('');
  });

  it('decodes the entities that leak into tags and leaves others alone', () => {
    expect(decodeEntities('R&amp;B &quot;x&quot; &#39;y&apos; &lt;z&gt; &copy;')).toBe(
      'R&B "x" \'y\' <z> &copy;',
    );
  });

  it('keeps the stored genre as the link, drops numbers and duplicates, caps the count', () => {
    expect(
      genreChips([
        'Folk Rock',
        'Indie Rock',
        '17',
        'folk rock',
        'Rock',
        'Folk',
        'Singer-Songwriter',
      ]),
    ).toEqual([
      { label: 'Folk Rock', genre: 'Folk Rock' },
      { label: 'Indie Rock', genre: 'Indie Rock' },
      { label: 'Rock', genre: 'Rock' },
      { label: 'Folk', genre: 'Folk' },
    ]);
    expect(genreChips(['Fiction:Fantasy', 'Kids:Fantasy'])).toEqual([
      { label: 'Fantasy', genre: 'Fiction:Fantasy' },
    ]);
    expect(genreChips(undefined)).toEqual([]);
    expect(genreChips(['A', 'B', 'C'], 2)).toHaveLength(2);
  });
});
