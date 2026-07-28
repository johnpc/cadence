import { LoadState } from '../../components/LoadState';
import { TrackRow } from '../player/TrackRow';
import { useAudiobookLibrary } from './useAudiobookLibrary';

/** The audiobook library browse view: a "Continue listening" section (in-progress
 * books) followed by every book, each a playable row that resumes where you left
 * off (see useAudiobookResume). Books play directly — no album/track drill-in. */
export function Audiobooks() {
  const { books, resumable, isLoading, isError, refetch } = useAudiobookLibrary();
  const ctx = { kind: 'audiobooks', label: 'Audiobooks', path: '/audiobooks' };
  return (
    <LoadState
      isLoading={isLoading}
      isError={isError}
      onRetry={refetch}
      isEmpty={books.length === 0}
      emptyTitle="No audiobooks"
      emptyMessage="Add audiobooks to your Jellyfin Books library and they'll appear here."
    >
      <div data-testid="audiobooks">
        {resumable.length > 0 && (
          <section data-testid="audiobooks-continue">
            <h2 className="cad-kicker">Continue listening</h2>
            {resumable.map((b, i) => (
              <TrackRow key={b.Id} track={b} queue={resumable} index={i} context={ctx} />
            ))}
          </section>
        )}
        <section>
          <h2 className="cad-kicker">All audiobooks</h2>
          {books.map((b, i) => (
            <TrackRow key={b.Id} track={b} queue={books} index={i} context={ctx} />
          ))}
        </section>
      </div>
    </LoadState>
  );
}
