import { SPOTIFY_PLAYLISTS, spotifyEmbedUrl } from "@/features/music/utils/musicUtils";

export const SHARED_MEMORY_PLAYLIST = SPOTIFY_PLAYLISTS[0];

export const DEDICATED_PLAYLISTS = {
  truck: {
    id: "1UR7GhwklC22Dx6deuweNH",
    label: "90s Road Trip",
  },

  rain: {
    id: "1UR7GhwklC22Dx6deuweNH",
    label: "90s Monsoon Memories",
  },
};

export function getPlaylistForScene(sceneId) {
  return DEDICATED_PLAYLISTS[sceneId] || SHARED_MEMORY_PLAYLIST;
}

export { SPOTIFY_PLAYLISTS, spotifyEmbedUrl };