import { useHistory } from 'react-router-dom';
import { TrackRow } from '../player/TrackRow';
import { artistLine } from '../player/playerFormat';
import { ResultRow } from './ResultRow';
import type { SearchGroups } from './searchGroups';
import type { RecentItem } from './recentSearchStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The grouped Songs / Albums / Artists sections. Records each tap as recent. */
export function SearchResults({
  groups,
  onPick,
}: {
  groups: SearchGroups;
  onPick: (item: RecentItem) => void;
}) {
  const history = useHistory();
  const goAlbum = (a: JellyfinItem) => {
    onPick(a);
    history.push(`/album/${a.Id}`);
  };
  const goArtist = (a: JellyfinItem) => {
    onPick(a);
    history.push(`/artist/${a.Id}`);
  };
  return (
    <div data-testid="search-results">
      {groups.songs.length > 0 && (
        <section>
          <h2 className="cad-kicker search__section">Songs</h2>
          {groups.songs.map((t, i) => (
            <TrackRow
              key={t.Id}
              track={t}
              queue={groups.songs}
              index={i}
              onPlay={() => onPick(t)}
            />
          ))}
        </section>
      )}
      {groups.albums.length > 0 && (
        <section>
          <h2 className="cad-kicker search__section">Albums</h2>
          {groups.albums.map((a) => (
            <ResultRow key={a.Id} item={a} subtitle={artistLine(a)} onSelect={goAlbum} />
          ))}
        </section>
      )}
      {groups.artists.length > 0 && (
        <section data-testid="search-artists">
          <h2 className="cad-kicker search__section">Artists</h2>
          {groups.artists.map((a) => (
            <ResultRow key={a.Id} item={a} subtitle="Artist" onSelect={goArtist} />
          ))}
        </section>
      )}
    </div>
  );
}
