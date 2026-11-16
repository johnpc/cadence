import { RequestPrompt } from '../requests/RequestPrompt';
import { GrabPrompt } from '../grab/GrabPrompt';

/** What extensions offer under an empty search: "request it" (Lidarr) and
 * "grab it" (Music Grabber). Each renders nothing when its extension is off. */
export function SearchEmptyExtras({ query, show }: { query: string; show: boolean }) {
  return (
    <>
      <RequestPrompt query={query} show={show} />
      <GrabPrompt query={query} show={show} />
    </>
  );
}
