import { useNavigate } from "react-router-dom";
import { Music2, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from "lucide-react";
import { PLAYLIST_TONES } from "../constants/musicConstants";
import { formatTime } from "../utils/musicUtils";

export default function BottomPlayer({ player }) {
  const navigate = useNavigate();
  const {
    audioRef,
    activeSong,
    activeIndex,
    isPlaying,
    isMuted,
    isShuffle,
    isRepeat,
    volume,
    progress,
    currentTime,
    duration,
    togglePlayPause,
    playAt,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    setVolumeLevel,
    handleSeek,
  } = player;

  if (!activeSong) return null;

  const tone = PLAYLIST_TONES[activeSong.category];
  const hasAudio = Boolean(activeSong.src);
  const openPlaylist = () => activeSong.playlistId && navigate(`/music/playlist/${activeSong.playlistId}`);

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 px-4">
      <audio ref={audioRef} src={activeSong.src || undefined} preload="metadata" />

      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 rounded-[22px] bg-emerald-950 px-4 py-3 text-white shadow-[0_20px_40px_rgba(15,47,32,0.35)]">
        {/* Now playing */}
        <button
          type="button"
          onClick={openPlaylist}
          disabled={!activeSong.playlistId}
          aria-label={activeSong.playlistTitle ? `Open ${activeSong.playlistTitle}` : activeSong.title}
          className="flex min-w-0 flex-[1_1_200px] items-center gap-3 text-left disabled:cursor-default"
        >
          <span
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-lg ${
              tone ? tone.soft : "bg-white/10 text-white"
            }`}
          >
            {activeSong.playlistMark || <Music2 size={20} />}
          </span>
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-bold">{activeSong.title}</span>
            <span className="truncate text-xs text-emerald-200">
              {activeSong.subtitle}
              {activeSong.playlistTitle && ` · ${activeSong.playlistTitle}`}
            </span>
          </span>
        </button>

        {/* Transport + progress */}
        <div className="flex min-w-0 flex-[2_1_300px] flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleShuffle}
              aria-label="Shuffle"
              aria-pressed={isShuffle}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                isShuffle ? "text-emerald-400" : "text-emerald-200 hover:text-white"
              }`}
            >
              <Shuffle size={16} />
            </button>
            <button
              type="button"
              onClick={() => playAt(activeIndex - 1)}
              aria-label="Previous song"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-emerald-950 transition-transform hover:scale-105"
            >
              {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => playAt(activeIndex + 1)}
              aria-label="Next song"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={toggleRepeat}
              aria-label="Repeat"
              aria-pressed={isRepeat}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                isRepeat ? "text-emerald-400" : "text-emerald-200 hover:text-white"
              }`}
            >
              <Repeat size={16} />
            </button>
          </div>

          <div className="flex w-full items-center gap-2.5 text-[11px] tabular-nums text-emerald-200">
            <span className="w-9 text-right">{formatTime(currentTime)}</span>
            <div
              className="h-1.5 flex-1 cursor-pointer overflow-hidden rounded-full bg-white/15"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = ((e.clientX - rect.left) / rect.width) * 100;
                handleSeek(Math.min(100, Math.max(0, pct)));
              }}
            >
              <div
                className="h-full rounded-full bg-emerald-400 transition-[width] duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="w-9">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Status + volume */}
        <div className="hidden flex-[1_1_160px] items-center justify-end gap-3 text-xs md:flex">
          {hasAudio ? (
            <span className="text-emerald-200">Playing in your outlet</span>
          ) : (
            <span className="text-amber-300">Audio not linked yet</span>
          )}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="text-emerald-200 transition-colors hover:text-white"
          >
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolumeLevel(Number(e.target.value))}
            className="w-20 accent-emerald-400"
            aria-label="Volume"
          />
        </div>
      </div>
    </div>
  );
}
