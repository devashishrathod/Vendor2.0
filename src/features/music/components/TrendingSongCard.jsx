import { Play, Pause } from "lucide-react";
import { formatTime } from "../utils/musicUtils";

// Deterministic accent color per song, based on its title — keeps the row
// visually varied without needing real album art.
const ACCENT_GRADIENTS = [
  "from-emerald-400 to-teal-500",
  "from-orange-400 to-rose-500",
  "from-sky-400 to-blue-500",
  "from-purple-400 to-indigo-500",
  "from-amber-400 to-orange-500",
  "from-pink-400 to-fuchsia-500",
];

function accentFor(title) {
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = title.charCodeAt(i) + ((hash << 5) - hash);
  return ACCENT_GRADIENTS[Math.abs(hash) % ACCENT_GRADIENTS.length];
}

export default function TrendingSongCard({ song, isActive, isPlaying, duration, onPlay }) {
  return (
    <button type="button" onClick={() => onPlay(song)} className="group flex-shrink-0 w-24 text-center">
      <div
        className={`relative w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${accentFor(song.title)} flex items-center justify-center overflow-hidden`}
      >
        <span className="text-white/90 text-lg font-bold">{song.title.charAt(0)}</span>
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
          <span
            className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md transition-opacity
              ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
          >
            {isActive && isPlaying ? (
              <Pause size={13} fill="black" className="text-black" />
            ) : (
              <Play size={13} fill="black" className="text-black ml-0.5" />
            )}
          </span>
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold text-gray-800 truncate">{song.title}</p>
      <p className="text-[11px] text-gray-400 truncate">{song.subtitle}</p>
      <p className="text-[10px] text-gray-300">{duration != null ? formatTime(duration) : "--:--"}</p>
    </button>
  );
}
