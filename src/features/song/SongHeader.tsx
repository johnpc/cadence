import { IonIcon } from '@ionic/react';
import { play, radio } from 'ionicons/icons';
import { TrackArt } from '../player/TrackArt';
import { GradientHeader } from '../color/GradientHeader';
import { GenreChips } from '../../components/GenreChips';
import { LikeButton } from '../library/LikeButton';
import { ShareButton } from '../share/ShareButton';
import { AddToPlaylistButton } from '../playlists/AddToPlaylistButton';
import { SongLinks } from './SongLinks';
import { songMetaLine } from './songMeta';
import type { JellyfinItem } from '../../lib/jellyfinTypes';

/** The song page hero: art over an ambient gradient, title, linked artist·album
 * line, year·duration meta, genres, and the play / radio / like / share / add
 * actions. `song` is guaranteed non-null (rendered inside a resolved LoadState). */
export function SongHeader({
  song,
  onPlay,
  onRadio,
}: {
  song: JellyfinItem;
  onPlay: () => void;
  onRadio: () => void;
}) {
  return (
    <GradientHeader item={song}>
      <div className="song__header">
        <TrackArt item={song} size={200} />
        <h1 className="song__title cad-headline">{song.Name}</h1>
        <SongLinks song={song} />
        {songMetaLine(song) && <p className="song__meta cad-meta">{songMetaLine(song)}</p>}
        <GenreChips genres={song.Genres} />
        <div className="song__actions">
          <LikeButton track={song} size={26} />
          <button className="song__play" data-testid="song-play" aria-label="Play" onClick={onPlay}>
            <IonIcon icon={play} aria-hidden="true" />
          </button>
          <button
            className="song__radio"
            data-testid="song-radio"
            aria-label="Start song radio"
            onClick={onRadio}
          >
            <IonIcon icon={radio} /> Radio
          </button>
          <ShareButton item={song} />
          <AddToPlaylistButton track={song} />
        </div>
      </div>
    </GradientHeader>
  );
}
