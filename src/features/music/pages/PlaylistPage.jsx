import { useCallback } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { ChevronLeft, Clock, ExternalLink, Heart, Music, Pause, Play, Shuffle } from "lucide-react";
import TrackRow, { TRACK_GRID } from "../components/TrackRow";
import { PLAYLIST_TONES } from "../constants/musicConstants";
import { usePlaylistCatalog } from "../hooks/usePlaylistCatalog";
import { usePlaylistPlayback } from "../hooks/usePlaylistPlayback";
import { useMusicStore } from "../store";
import { formatTotalDuration, playlistTag, spotifyPlaylistUrl } from "../utils/musicUtils";

/**
 * A playlist's own page — /music/playlist/:playlistId — with its full song
 * list. Playback goes through the app-wide player, so the bottom bar keeps
 * playing when you go back.
 */
export default function PlaylistPage() {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { player } = useOutletContext();
  const { playlists, loading, error } = usePlaylistCatalog();
  const { isPlaylistPlaying, isTrackCurrent, playPlaylist, playTrack } = usePlaylistPlayback(player);
  const favouriteIds = useMusicStore((s) => s.favouritePlaylistIds);
  const likedTrackIds = useMusicStore((s) => s.likedTrackIds);
  const toggleFavouritePlaylist = useMusicStore((s) => s.toggleFavouritePlaylist);
  const toggleLikedTrack = useMusicStore((s) => s.toggleLikedTrack);

  const playlist = playlists.find((p) => p.id === playlistId);

  const handleBack = useCallback(() => navigate("/music"), [navigate]);
  const handlePlayTrack = useCallback((index) => playTrack(playlist, index), [playTrack, playlist]);

  const backButton = (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex h-11 items-center gap-2 self-start rounded-full border border-gray-200 bg-white pl-3 pr-4 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
    >
      <ChevronLeft size={16} /> All playlists
    </button>
  );

  if (loading || error || !playlist) {
    return (
      <div className="min-h-screen bg-app pb-32 dark:bg-gray-900">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8">
          {backButton}
          {loading ? (
            <div className="h-64 animate-pulse rounded-[28px] bg-white/60 dark:bg-gray-800/60" />
          ) : (
            <p className={`text-sm ${error ? "text-rose-500" : "text-gray-500"}`}>
              {error || "This playlist doesn't exist."}
            </p>
          )}
        </div>
      </div>
    );
  }

  const tone = PLAYLIST_TONES[playlist.category];
  const playingNow = isPlaylistPlaying(playlist.id);
  const isFavourite = favouriteIds.includes(playlist.id);

  return (
    <div className="min-h-screen bg-app pb-32 dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-8">
        {backButton}

        <div className={`flex flex-wrap items-end gap-7 rounded-[28px] p-5 sm:p-7 ${tone.header}`}>
          <div
            className={`flex h-40 w-40 shrink-0 flex-col justify-between rounded-3xl p-5 text-white shadow-[0_20px_40px_rgba(17,24,39,0.18)] sm:h-[200px] sm:w-[200px] ${tone.solid}`}
          >
            <Music size={22} className="opacity-80" />
            <span className="font-display text-5xl leading-none sm:text-6xl">{playlist.mark}</span>
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-85">Trydood</span>
          </div>

          <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-2.5">
            <span className={`text-[11px] font-bold uppercase tracking-[0.16em] ${tone.text}`}>
              Playlist · {playlistTag(playlist, PLAYLIST_TONES)}
            </span>
            <h1 className="font-display text-4xl leading-tight text-gray-900 sm:text-5xl dark:text-gray-100">
              {playlist.title}
            </h1>
            <p className="max-w-xl text-sm leading-6 text-gray-700 dark:text-gray-300">{playlist.description}</p>
            <div className="flex flex-wrap items-center gap-2 text-[13px] text-gray-700 dark:text-gray-300">
              <span className="inline-flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-100">
                <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-emerald-600 text-[11px] font-extrabold text-white">
                  T
                </span>
                Curated by Trydood
              </span>
              <span aria-hidden="true">·</span>
              <span>{playlist.tracks.length} songs</span>
              <span aria-hidden="true">·</span>
              <span>{formatTotalDuration(playlist.tracks)}</span>
              <span className={`rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold dark:bg-gray-900/40 ${tone.text}`}>
                {playlist.vibe}
              </span>
            </div>
          </div>
        </div>

        <div className="bento-card flex flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => playPlaylist(playlist)}
              aria-label={`${playingNow ? "Pause" : "Play"} ${playlist.title}`}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-[0_10px_24px_rgba(5,150,105,0.35)] transition-colors hover:bg-emerald-700"
            >
              {playingNow ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={player.toggleShuffle}
              aria-pressed={player.isShuffle}
              aria-label="Shuffle"
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${
                player.isShuffle
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "border-gray-200 bg-white text-gray-500 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800"
              }`}
            >
              <Shuffle size={18} />
            </button>
            <button
              type="button"
              onClick={() => toggleFavouritePlaylist(playlist.id)}
              aria-pressed={isFavourite}
              aria-label={isFavourite ? "Remove from favourites" : "Add to favourites"}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            >
              <Heart
                size={18}
                className={isFavourite ? "text-rose-600" : "text-gray-400"}
                fill={isFavourite ? "currentColor" : "none"}
              />
            </button>
            {playlist.spotifyId && (
              <a
                href={spotifyPlaylistUrl(playlist.spotifyId)}
                target="_blank"
                rel="noreferrer"
                className="ml-auto inline-flex h-11 items-center gap-2 rounded-full border border-gray-200 bg-white px-4 text-[13px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                Open in Spotify <ExternalLink size={13} />
              </a>
            )}
          </div>

          <div className="flex flex-col">
            <div
              className={`border-b border-gray-200 px-3 pb-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500 dark:border-gray-700 ${TRACK_GRID}`}
            >
              <span className="pl-[52px]">Title</span>
              <span className="hidden sm:block">Film / Album</span>
              <span className="sr-only">Like</span>
              <span className="flex justify-end">
                <Clock size={14} aria-label="Duration" />
              </span>
            </div>
            {playlist.tracks.map((track, i) => {
              const trackId = `${playlist.id}-${i}`;
              return (
                <TrackRow
                  key={trackId}
                  track={track}
                  index={i}
                  trackId={trackId}
                  isCurrent={isTrackCurrent(playlist.id, i)}
                  isPlaying={player.isPlaying}
                  isLiked={likedTrackIds.includes(trackId)}
                  onPlay={handlePlayTrack}
                  onToggleLike={toggleLikedTrack}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
