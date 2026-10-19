import { memo } from "react";
import { Heart, Pause, Play } from "lucide-react";
import { PLAYLIST_TONES } from "../constants/musicConstants";
import { playlistTag } from "../utils/musicUtils";
import EqualizerBars from "./EqualizerBars";

/**
 * One playlist tile in the Music page grid. The body opens the playlist;
 * the round buttons play it straight away or toggle it as a favourite.
 */
function PlaylistCard({ playlist, isCurrent, isPlaying, isFavourite, onOpen, onPlay, onToggleFavourite }) {
  const tone = PLAYLIST_TONES[playlist.category];
  const playingNow = isCurrent && isPlaying;

  return (
    <div
      className={`flex items-center gap-1 rounded-[20px] border-2 bg-white py-2.5 pl-2.5 pr-1.5 transition-shadow hover:shadow-[0_10px_30px_rgba(5,150,105,0.14)] dark:bg-gray-800 ${
        isCurrent
          ? "border-emerald-600 shadow-[0_10px_30px_rgba(5,150,105,0.18)]"
          : "border-transparent shadow-sm"
      }`}
    >
      <button
        type="button"
        onClick={() => onOpen(playlist)}
        aria-label={`Open ${playlist.title}`}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl font-display text-2xl ${tone.soft}`}>
          {playlist.mark}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className={`text-[10px] font-bold uppercase tracking-[0.12em] ${tone.text}`}>
            {playlistTag(playlist, PLAYLIST_TONES)}
          </span>
          <span className="truncate text-sm font-bold text-gray-900 dark:text-gray-100">{playlist.title}</span>
          {playingNow ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              <EqualizerBars /> Now playing
            </span>
          ) : (
            <span className="truncate text-xs text-gray-500 dark:text-gray-400">
              {playlist.tracks.length} songs · {playlist.vibe}
            </span>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={() => onPlay(playlist)}
        aria-label={`${playingNow ? "Pause" : "Play"} ${playlist.title}`}
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${
          isCurrent
            ? "bg-emerald-600 text-white hover:bg-emerald-700"
            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400"
        }`}
      >
        {playingNow ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
      </button>

      <button
        type="button"
        onClick={() => onToggleFavourite(playlist.id)}
        aria-pressed={isFavourite}
        aria-label={isFavourite ? `Remove ${playlist.title} from favourites` : `Add ${playlist.title} to favourites`}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
      >
        <Heart
          size={18}
          className={isFavourite ? "text-rose-600" : "text-gray-400 hover:text-rose-400"}
          fill={isFavourite ? "currentColor" : "none"}
        />
      </button>
    </div>
  );
}

export default memo(PlaylistCard);
