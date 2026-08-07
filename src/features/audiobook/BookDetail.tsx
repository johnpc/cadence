import {
  IonButtons,
  IonBackButton,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useParams } from 'react-router-dom';
import { LoadState } from '../../components/LoadState';
import { GenreChips } from '../../components/GenreChips';
import { BookHeader } from './BookHeader';
import { BookFacts } from './BookFacts';
import { BookParts } from './BookParts';
import { BookChapters } from './BookChapters';
import { useBook } from './useBook';
import './bookDetail.css';

/** One audiobook: cover + title + author + whole-book progress + Resume/Play and
 * download (BookHeader), genres, the book's description, a facts block (length,
 * parts, year, date added), and finally the chapter/part list — BookParts for a
 * multi-file book, BookChapters (embedded m4b markers) for a single-file one.
 * Shares the library's fast plugin path via useBook, so opening a book off the
 * list is a cache hit — no extra fetch. */
export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const { book, isLoading, isError, refetch } = useBook(decodeURIComponent(id));

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/audiobooks" />
          </IonButtons>
          <IonTitle>{book?.title ?? 'Audiobook'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        <LoadState
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          isEmpty={!book}
          emptyTitle="Book not found"
          emptyMessage="This audiobook isn't in your library anymore."
        >
          {book && (
            <div data-testid="book-detail">
              <BookHeader book={book} />
              <GenreChips genres={book.book.Genres} />
              {book.book.Overview && (
                <section data-testid="book-about">
                  <h2 className="cad-kicker">About</h2>
                  <p className="cad-meta book-detail__about">{book.book.Overview}</p>
                </section>
              )}
              <BookFacts book={book} />
              <BookParts book={book} />
              <BookChapters book={book} />
            </div>
          )}
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
