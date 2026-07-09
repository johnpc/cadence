import { useHistory } from 'react-router-dom';
import { TrackRow } from '../player/TrackRow';
import { artistLine } from '../player/playerFormat';
import { ResultRow } from './ResultRow';
import { TopResult } from './TopResult';
import { topResult, type SearchGroups } from './searchGroups';
import type { RecentItem } from './recentSearchStore';
import type { SearchFilter } from './SearchFilters';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The grouped Songs / Albums / Artists / Playlists sections, narrowed by the
 * active filter, with a featured Top result under "All". Records taps. */
export function SearchResults({
  groups,
  filter,
  query,
  onPick,
}: {
  groups: SearchGroups;
  filter: SearchFilter;
  query: string;
  onPick: (item: RecentItem) => void;
}) {
  const history = useHistory();
  const show = (kind: SearchFilter) => filter === 'all' || filter === kind;
  const hero = filter === 'all' ? topResult(groups, query) : null;
  const goAlbum = (a: JellyfinItem) => {
    onPick(a);
    history.push(`/album/${a.Id}`);
  };
  const goArtist = (a: JellyfinItem) => {
    onPick(a);
    history.push(`/artist/${a.Id}`);
  };
  const goPlaylist = (p: JellyfinItem) => {
    onPick(p);
    history.push(`/playlist/${p.Id}`);
  };
  return (
    <div data-testid="search-results">
      {hero && <TopResult item={hero} onPick={onPick} />}
      {show('songs') && groups.songs.length > 0 && (
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
      {show('albums') && groups.albums.length > 0 && (
        <section data-testid="search-albums">
          <h2 className="cad-kicker search__section">Albums</h2>
          {groups.albums.map((a) => (
            <ResultRow key={a.Id} item={a} subtitle={artistLine(a)} onSelect={goAlbum} />
          ))}
        </section>
      )}
      {show('artists') && groups.artists.length > 0 && (
        <section data-testid="search-artists">
          <h2 className="cad-kicker search__section">Artists</h2>
          {groups.artists.map((a) => (
            <ResultRow key={a.Id} item={a} subtitle="Artist" onSelect={goArtist} />
          ))}
        </section>
      )}
      {show('playlists') && groups.playlists.length > 0 && (
        <section data-testid="search-playlists">
          <h2 className="cad-kicker search__section">Playlists</h2>
          {groups.playlists.map((p) => (
            <ResultRow key={p.Id} item={p} subtitle="Playlist" onSelect={goPlaylist} />
          ))}
        </section>
      )}
    </div>
  );
}
