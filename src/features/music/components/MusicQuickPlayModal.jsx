import { X, Music2, Square } from "lucide-react";
import { getPlaylistForScene } from "@/data/spotify";
import { spotifyEmbedUrl } from "../utils/musicUtils";

// No "scene" concept exists in the vendor panel yet, so this always falls
// back to the shared "90s Yaadein" playlist from src/data/spotify.js.
// Spotify's own playlist embed already renders a scrollable track list +
// play controls, so there's no separate custom song-list UI here.
const playlist = getPlaylistForScene();

export default function MusicQuickPlayModal({ open, onClose, player }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Music2 size={16} />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{playlist.label}</h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                player?.stopPlayback();
                onClose();
              }}
              aria-label="Stop music"
              title="Stop music"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
            >
              <Square size={14} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-3">
          <iframe
            key={playlist.id}
            src={spotifyEmbedUrl(playlist.id)}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title="Spotify player"
          />
        </div>
      </div>
    </div>
  );
}
