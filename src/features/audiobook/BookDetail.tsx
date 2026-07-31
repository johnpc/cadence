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
import { BookHeader } from './BookHeader';
import { BookParts } from './BookParts';
import { useBook } from './useBook';
import './bookDetail.css';

/** One audiobook: cover + title + author + whole-book progress + Resume/Play and
 * download (BookHeader), the chapter/part list (BookParts, multi-file only), and
 * the book's description. Shares the library's fast plugin path via useBook, so
 * opening a book off the list is a cache hit — no extra fetch. */
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
              <BookParts book={book} />
              {book.book.Overview && (
                <section data-testid="book-about">
                  <h2 className="cad-kicker">About</h2>
                  <p className="cad-meta book-detail__about">{book.book.Overview}</p>
                </section>
              )}
            </div>
          )}
        </LoadState>
      </IonContent>
    </IonPage>
  );
}
