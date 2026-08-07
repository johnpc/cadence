import { bookFacts } from './bookInfo';
import type { Book } from './groupBooks';

/** The book's info block: a labelled list of facts (length, parts, year, when
 * added) — the parts count is always present, so it always renders. */
export function BookFacts({ book }: { book: Book }) {
  const facts = bookFacts(book);
  return (
    <section data-testid="book-facts">
      <h2 className="cad-kicker">Details</h2>
      <dl className="book-detail__facts">
        {facts.map((f) => (
          <div key={f.label} className="book-detail__fact" data-testid="book-fact">
            <dt className="cad-meta">{f.label}</dt>
            <dd>{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
