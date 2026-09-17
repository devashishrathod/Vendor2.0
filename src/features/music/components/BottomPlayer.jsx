import { Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, ListMusic } from "lucide-react";
import MiniWave from "./MiniWave";
import { formatTime } from "../utils/musicUtils";

export default function BottomPlayer({ player }) {
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

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40">
      <audio ref={audioRef} src={activeSong.src} preload="metadata" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center gap-4">
        {/* Now playing */}
        <div className="flex items-center gap-3 min-w-0 w-40 sm:w-64 flex-shrink-0">
          <MiniWave isPlaying={isPlaying} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{activeSong.title}</p>
            <p className="text-xs text-gray-400 truncate">{activeSong.subtitle}</p>
          </div>
        </div>

        {/* Mobile-only compact play/pause — the full transport below is desktop only */}
        <button
          onClick={togglePlayPause}
          className="sm:hidden ml-auto w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center flex-shrink-0"
          aria-label="Play or pause"
        >
          {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
        </button>

        {/* Transport + progress */}
        <div className="hidden sm:block flex-1 min-w-0">
          <div className="flex items-center justify-center gap-4 mb-1">
            <button
              onClick={toggleShuffle}
              className={`transition-colors ${isShuffle ? "text-emerald-500" : "text-gray-400 hover:text-gray-600"}`}
              aria-label="Toggle shuffle"
              aria-pressed={isShuffle}
            >
              <Shuffle size={15} />
            </button>
            <button
              onClick={() => playAt(activeIndex - 1)}
              className="text-gray-500 hover:text-gray-800 transition-colors"
              aria-label="Previous song"
            >
              <SkipBack size={17} />
            </button>
            <button
              onClick={togglePlayPause}
              className="w-9 h-9 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-colors"
              aria-label="Play or pause"
            >
              {isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
            </button>
            <button
              onClick={() => playAt(activeIndex + 1)}
              className="text-gray-500 hover:text-gray-800 transition-colors"
              aria-label="Next song"
            >
              <SkipForward size={17} />
            </button>
            <button
              onClick={toggleRepeat}
              className={`transition-colors ${isRepeat ? "text-emerald-500" : "text-gray-400 hover:text-gray-600"}`}
              aria-label="Toggle repeat"
              aria-pressed={isRepeat}
            >
              <Repeat size={15} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 tabular-nums w-9 text-right flex-shrink-0">
              {formatTime(currentTime)}
            </span>
            <div
              className="flex-1 h-1 bg-gray-100 rounded-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = ((e.clientX - rect.left) / rect.width) * 100;
                handleSeek(Math.min(100, Math.max(0, pct)));
              }}
            >
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400 tabular-nums w-9 flex-shrink-0">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume */}
        <div className="hidden md:flex items-center gap-2 w-28 flex-shrink-0">
          <button onClick={toggleMute} className="text-gray-400 hover:text-gray-700 transition-colors" aria-label="Toggle mute">
            {isMuted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolumeLevel(Number(e.target.value))}
            className="w-20 accent-emerald-500"
            aria-label="Volume"
          />
        </div>

        <button
          type="button"
          className="hidden lg:flex items-center justify-center text-gray-400 hover:text-gray-700 flex-shrink-0 transition-colors"
          aria-label="Queue"
        >
          <ListMusic size={17} />
        </button>
      </div>
    </div>
  );
}
