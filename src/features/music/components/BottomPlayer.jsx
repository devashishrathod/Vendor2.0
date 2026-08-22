import { Heart, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward } from "lucide-react";
import MiniWave from "./MiniWave";
import { formatTime } from "../utils/musicUtils";

export default function BottomPlayer({ player }) {
  const {
    audioRef,
    activeSong,
    activeIndex,
    queueName,
    isPlaying,
    isMuted,
    favorites,
    progress,
    currentTime,
    duration,
    togglePlayPause,
    playAt,
    toggleFavorite,
    toggleMute,
    handleSeek,
  } = player;

  if (!activeSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_16px_rgba(0,0,0,0.05)] z-40">
      <div
        className="h-1 bg-gray-100 cursor-pointer"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const pct = ((e.clientX - rect.left) / rect.width) * 100;
          handleSeek(Math.min(100, Math.max(0, pct)));
        }}
      >
        <div
          className="h-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 transition-all duration-200"
          style={{ width: `${progress}%` }}
        />
      </div>

      <audio ref={audioRef} src={activeSong.src} preload="metadata" />

      <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-4">
        <MiniWave isPlaying={isPlaying} />

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">{activeSong.title}</p>
          <p className="text-xs text-gray-400 truncate">
            {activeSong.subtitle} <span className="text-gray-300">·</span> {queueName}
          </p>
        </div>

        <span className="hidden sm:block text-[11px] text-gray-400 tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavorite(activeSong.id)}
            className={`p-2 rounded-full transition-colors ${
              favorites[activeSong.id] ? "text-red-500" : "text-gray-400 hover:text-red-400"
            }`}
            aria-label="Toggle favorite"
          >
            <Heart size={16} fill={favorites[activeSong.id] ? "currentColor" : "none"} />
          </button>

          <button
            onClick={() => playAt(activeIndex - 1)}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Previous song"
          >
            <SkipBack size={16} />
          </button>

          <button
            onClick={togglePlayPause}
            className="p-3 rounded-full bg-emerald-400 text-white hover:bg-emerald-500 transition-colors"
            aria-label="Play or pause"
          >
            {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
          </button>

          <button
            onClick={() => playAt(activeIndex + 1)}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Next song"
          >
            <SkipForward size={16} />
          </button>

          <button
            onClick={toggleMute}
            className="p-2 rounded-full text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Toggle mute"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
