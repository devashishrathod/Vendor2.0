import { useCallback } from "react";
import { toPlayerCollection } from "../utils/musicUtils";

/**
 * Playlist-level controls on top of the app-wide usePlayer() instance.
 * @param {ReturnType<import("./usePlayer").usePlayer>} player
 */
export function usePlaylistPlayback(player) {
  const { queueName, activeIndex, isPlaying, isShuffle, playSongInCollection, togglePlayPause } = player;

  const isPlaylistCurrent = useCallback((playlistId) => queueName === playlistId, [queueName]);

  const isPlaylistPlaying = useCallback(
    (playlistId) => queueName === playlistId && isPlaying,
    [queueName, isPlaying]
  );

  const isTrackCurrent = useCallback(
    (playlistId, index) => queueName === playlistId && activeIndex === index,
    [queueName, activeIndex]
  );

  /** Play/pause a whole playlist — starts at a random song when shuffle is on. */
  const playPlaylist = useCallback(
    (playlist) => {
      if (queueName === playlist.id) {
        togglePlayPause();
        return;
      }
      const start = isShuffle ? Math.floor(Math.random() * playlist.tracks.length) : 0;
      playSongInCollection(toPlayerCollection(playlist), start);
    },
    [queueName, isShuffle, togglePlayPause, playSongInCollection]
  );

  /** Play one song; clicking the current song toggles play/pause. */
  const playTrack = useCallback(
    (playlist, index) => playSongInCollection(toPlayerCollection(playlist), index),
    [playSongInCollection]
  );

  return { isPlaylistCurrent, isPlaylistPlaying, isTrackCurrent, playPlaylist, playTrack };
}
