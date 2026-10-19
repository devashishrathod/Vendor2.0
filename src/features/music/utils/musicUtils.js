export function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatTime(sec) {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const SPOTIFY_PLAYLISTS = [
  {
    id: "1UR7GhwklC22Dx6deuweNH",
    label: "90s Yaadein",
    description: "Evergreen Hindi songs for a relaxed, nostalgic ambience.",
    language: "Hindi",
  },
  {
    id: "04wyLWYsskgWjn9827AQj3",
    label: "Tamil Playlist",
    description: "Tamil favourites for a lively outlet atmosphere.",
    language: "Tamil",
  },
  {
    id: "1qpyCtjj5fW0g1FaKEFAOo",
    label: "Punjabi Playlist",
    description: "Punjabi hits to bring energy to your outlet.",
    language: "Punjabi",
  },
];

export function spotifyEmbedUrl(playlistId) {
  return `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;
}

export function spotifyPlaylistUrl(playlistId) {
  return `https://open.spotify.com/playlist/${playlistId}`;
}

/** "5:03" → 303 */
export function durationToSeconds(duration) {
  const [m = 0, s = 0] = String(duration).split(":").map(Number);
  return m * 60 + s;
}

/** Total length of a track list, e.g. "27 min 4 sec". */
export function formatTotalDuration(tracks) {
  const total = tracks.reduce((sum, track) => sum + durationToSeconds(track.duration), 0);
  return `${Math.floor(total / 60)} min ${total % 60} sec`;
}

/** Small label for a playlist card: its decade, else its category name. */
export function playlistTag(playlist, tones) {
  return playlist.era || tones[playlist.category]?.label || "";
}

/**
 * Shape a catalog playlist into the `{ name, songs }` collection usePlayer
 * expects. `name` is the playlist id so usePlayer can tell queues apart.
 * @param {import("../constants/musicCatalog").CatalogPlaylist} playlist
 */
export function toPlayerCollection(playlist) {
  return {
    name: playlist.id,
    songs: playlist.tracks.map((track, i) => ({
      id: `${playlist.id}-${i}`,
      title: track.title,
      subtitle: track.artist,
      src: track.src || null,
      playlistId: playlist.id,
      playlistTitle: playlist.title,
      playlistMark: playlist.mark,
      category: playlist.category,
    })),
  };
}
