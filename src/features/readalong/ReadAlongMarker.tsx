import { ReadAlongBadge } from './ReadAlongBadge';
import { useReadAlongStatus } from './useReadAlongLibrary';

/** A book's read-along badge, looked up in the shared library list. */
export function ReadAlongMarker({ book }: { book: { id: string; parts: { Id: string }[] } }) {
  return <ReadAlongBadge status={useReadAlongStatus(book)} />;
}
