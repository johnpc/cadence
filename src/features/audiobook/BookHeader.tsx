import { IonButton, IonIcon } from '@ionic/react';
import { play, playSkipForward } from 'ionicons/icons';
import { TrackArt } from '../player/TrackArt';
import { DownloadCollectionButton } from '../downloads/DownloadCollectionButton';
import { playBook } from './playBook';
import { bookProgress } from './bookProgress';
import { bookProgressLabel } from './bookProgressLabel';
import { resumePartIndex } from './resumePartIndex';
import { usePlayer } from '../player/usePlayer';
import type { Book } from './groupBooks';

/** The book detail header: cover, title, author, whole-book progress, and the
 * primary actions — Resume (jumps to the part you were on) when started, else
 * Play from the beginning, plus a download-all control. */
export function BookHeader({ book }: { book: Book }) {
  const player = usePlayer();
  const author = book.book.AlbumArtist ?? book.book.Artists?.[0] ?? '';
  const progress = bookProgress(book);
  const label = bookProgressLabel(progress);
  const resumeAt = resumePartIndex(book);
  const started = progress.started && !progress.completed;

  return (
    <header className="book-detail__header" data-testid="book-header">
      <TrackArt item={book.book} size={160} />
      <h1 className="cad-headline" data-testid="book-title">
        {book.title}
      </h1>
      {author && <p className="cad-meta">{author}</p>}
      <p className="cad-meta" data-testid="book-progress-label">
        {book.parts.length > 1 ? `${book.parts.length} parts` : '1 part'}
        {label && <> · {label}</>}
      </p>
      <div className="book-detail__actions">
        <IonButton
          onClick={() => playBook(player, book, started ? resumeAt : 0)}
          data-testid="book-play"
        >
          <IonIcon slot="start" icon={started ? playSkipForward : play} />
          {started ? 'Resume' : 'Play'}
        </IonButton>
        <DownloadCollectionButton tracks={book.parts} />
      </div>
    </header>
  );
}
