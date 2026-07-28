import { useQuery } from '@tanstack/react-query';
import { fetchChapters } from './audiobookApi';
import { isAudiobook } from './isAudiobook';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import type { AudiobookChapter } from './audiobookTypes';

/**
 * Embedded chapters for the current track, fetched from the CadenceConfig plugin
 * — but ONLY for audiobook items (`Type: AudioBook`), so a normal music track
 * never triggers the plugin call. A file's chapters never change, so they're
 * cached aggressively. An empty list (or a fetch error, treated as empty) simply
 * means "no chapter navigation".
 */
export function useChapters(item: JellyfinItem | null): {
  chapters: AudiobookChapter[];
  isLoading: boolean;
} {
  const enabled = isAudiobook(item);
  const q = useQuery({
    queryKey: ['audiobook-chapters', item?.Id],
    queryFn: () => fetchChapters(item!.Id),
    enabled,
    staleTime: Infinity,
    gcTime: 60 * 60_000,
  });
  return {
    chapters: q.data ?? [],
    isLoading: enabled && q.isLoading,
  };
}
