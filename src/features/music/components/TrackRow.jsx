import { memo } from "react";
import { Heart, Play } from "lucide-react";
import EqualizerBars from "./EqualizerBars";

export const TRACK_GRID = "grid grid-cols-[minmax(0,1fr)_44px_48px] items-center gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_44px_48px]";

/** One song row on the playlist page. */
function TrackRow({ track, index, trackId, isCurrent, isPlaying, isLiked, onPlay, onToggleLike }) {
  const playingNow = isCurrent && isPlaying;

  return (
    <div
      className={`group mt-1 rounded-2xl px-3 py-1.5 transition-colors ${TRACK_GRID} ${
        isCurrent ? "bg-emerald-50 dark:bg-emerald-500/10" : "hover:bg-emerald-50/60 dark:hover:bg-gray-700/50"
      }`}
    >
      <button
        type="button"
        onClick={() => onPlay(index)}
        aria-label={`${playingNow ? "Pause" : "Play"} ${track.title}`}
        className="flex min-h-11 min-w-0 items-center gap-3 py-1 text-left"
      >
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[13px] font-bold ${
            isCurrent ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
          }`}
        >
          {playingNow ? (
            <EqualizerBars className="bg-emerald-300" />
          ) : (
            <>
              <span className="group-hover:hidden">{index + 1}</span>
              <Play size={12} fill="currentColor" className="hidden group-hover:block" />
            </>
          )}
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span
            className={`truncate text-sm font-bold ${
              isCurrent ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-gray-100"
            }`}
          >
            {track.title}
          </span>
          <span className="truncate text-xs text-gray-500 dark:text-gray-400">{track.artist}</span>
        </span>
      </button>

      <span className="hidden truncate text-[13px] text-gray-600 sm:block dark:text-gray-400">{track.film}</span>

      <button
        type="button"
        onClick={() => onToggleLike(trackId)}
        aria-pressed={isLiked}
        aria-label={`${isLiked ? "Unlike" : "Like"} ${track.title}`}
        className="flex h-11 w-11 items-center justify-center rounded-full"
      >
        <Heart
          size={16}
          className={isLiked ? "text-rose-600" : "text-gray-400 hover:text-rose-400"}
          fill={isLiked ? "currentColor" : "none"}
        />
      </button>

      <span className="text-right text-[13px] tabular-nums text-gray-500 dark:text-gray-400">{track.duration}</span>
    </div>
  );
}

export default memo(TrackRow);
