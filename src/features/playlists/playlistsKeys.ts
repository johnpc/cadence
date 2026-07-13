/** The react-query key for the user's playlists list. In its own module so both
 * the query hooks (playlistsApi) and the mutation hooks (playlistMutations) can
 * share it without a circular import. */
export const PLAYLISTS_KEY = ['playlists'];
