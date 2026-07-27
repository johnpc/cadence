/**
 * Pure Subsonic-wire-shape → MediaItem mappers. The one place the shape
 * differences (Subsonic songs use `title` not `name`; a single `artist`
 * string vs OpenSubsonic's linkable `artists[]`; `owner`/`public` vs
 * Jellyfin's `CanDelete`) get absorbed, so every navidrome*.ts lib file
 * funnels its raw JSON through here before returning to callers.
 */
import type { MediaItem } from './navidromeTypes';
import type {
  SubsonicChild,
  SubsonicAlbum,
  SubsonicArtist,
  SubsonicPlaylist,
} from './subsonicTypes';
import { ticksFromSeconds, artistNames, artistItems, genreNames } from './navidromeMapperHelpers';

export function mediaItemFromSong(song: SubsonicChild): MediaItem {
  return {
    Id: song.id,
    Name: song.title,
    Type: 'Audio',
    Album: song.album,
    Artists: artistNames(song.artists, song.artist),
    ArtistItems: artistItems(song.artists),
    AlbumId: song.albumId,
    RunTimeTicks: ticksFromSeconds(song.duration),
    IndexNumber: song.track,
    ParentIndexNumber: song.discNumber,
    ProductionYear: song.year,
    Genres: genreNames(song.genres, song.genre),
    UserData: { IsFavorite: !!song.starred },
    ImageTags: song.coverArt ? { Primary: song.coverArt } : undefined,
  };
}

export function mediaItemFromAlbum(album: SubsonicAlbum): MediaItem {
  return {
    Id: album.id,
    Name: album.name,
    Type: 'MusicAlbum',
    AlbumArtist: album.artist,
    Artists: artistNames(album.artists, album.artist),
    ArtistItems: artistItems(album.artists),
    AlbumId: album.id,
    ProductionYear: album.year,
    ChildCount: album.songCount,
    Genres: genreNames(album.genres, album.genre),
    UserData: { IsFavorite: !!album.starred },
    ImageTags: album.coverArt ? { Primary: album.coverArt } : undefined,
  };
}

export function mediaItemFromArtist(artist: SubsonicArtist): MediaItem {
  return {
    Id: artist.id,
    Name: artist.name,
    Type: 'MusicArtist',
    ChildCount: artist.albumCount,
    UserData: { IsFavorite: !!artist.starred },
    ImageTags: artist.coverArt ? { Primary: artist.coverArt } : undefined,
  };
}

/** `PlaylistItemId` holds the track's array INDEX (stringified) — Subsonic
 * addresses playlist entries by position, not a stable per-entry id. */
export function mediaItemFromPlaylist(
  playlist: SubsonicPlaylist,
  currentUsername: string,
): MediaItem {
  return {
    Id: playlist.id,
    Name: playlist.name,
    Type: 'Playlist',
    Overview: playlist.comment,
    ChildCount: playlist.songCount,
    CanDelete: playlist.owner === currentUsername,
    ImageTags: playlist.coverArt ? { Primary: playlist.coverArt } : undefined,
  };
}

export function mediaItemFromPlaylistEntry(entry: SubsonicChild, index: number): MediaItem {
  return { ...mediaItemFromSong(entry), PlaylistItemId: String(index) };
}
