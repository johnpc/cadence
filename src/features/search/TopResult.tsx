import { useHistory } from 'react-router-dom';
import { TrackArt } from '../player/TrackArt';
import { usePlayer } from '../player/usePlayer';
import { artistLine } from '../player/playerFormat';
import type { RecentItem } from './recentSearchStore';
import type { JellyfinItem } from '../../lib/jellyfinTypes';
import './topResult.css';

const KIND: Record<string, string> = {
  MusicArtist: 'Artist',
  MusicAlbum: 'Album',
  Playlist: 'Playlist',
  Audio: 'Song',
};

/** The featured "Top result" hero card. Tapping plays a song or opens the
 * album/artist/playlist; records the pick as a recent search. */
export function TopResult({
  item,
  onPick,
}: {
  item: JellyfinItem;
  onPick: (item: RecentItem) => void;
}) {
  const history = useHistory();
  const { playQueue } = usePlayer();
  const isArtist = item.Type === 'MusicArtist';
  const activate = () => {
    onPick(item);
    if (item.Type === 'MusicAlbum') history.push(`/album/${item.Id}`);
    else if (item.Type === 'MusicArtist') history.push(`/artist/${item.Id}`);
    else if (item.Type === 'Playlist') history.push(`/playlist/${item.Id}`);
    else playQueue([item], 0);
  };
  return (
    <section>
      <h2 className="cad-kicker search__section">Top result</h2>
      <button type="button" className="top-result" data-testid="top-result" onClick={activate}>
        <TrackArt item={item} size={92} round={isArtist} />
        <span className="top-result__name cad-headline">{item.Name}</span>
        <span className="top-result__kind cad-meta">
          {KIND[item.Type] ?? 'Result'}
          {artistLine(item) && ` · ${artistLine(item)}`}
        </span>
      </button>
    </section>
  );
}
