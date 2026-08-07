import { useState } from 'react';
import { aboutPreview, isAboutTruncatable } from './aboutPreview';

/** The book's description. Long text shows a shortened preview with a "Show more"
 * toggle that expands to the full text (and collapses back); short text renders
 * as-is with no toggle. Renders nothing when there's no description. */
export function BookAbout({ overview }: { overview: string | undefined }) {
  const [expanded, setExpanded] = useState(false);
  if (!overview) return null;
  const truncatable = isAboutTruncatable(overview);
  const text = expanded || !truncatable ? overview : aboutPreview(overview);

  return (
    <section data-testid="book-about">
      <h2 className="cad-kicker">About</h2>
      <p className="cad-meta book-detail__about">{text}</p>
      {truncatable && (
        <button
          type="button"
          className="book-detail__more"
          data-testid="book-about-toggle"
          aria-expanded={expanded}
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </section>
  );
}
