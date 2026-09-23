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
