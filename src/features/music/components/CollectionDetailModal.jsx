import { X } from "lucide-react";
import CollectionDetail from "./CollectionDetail";

// Full-album view for a collection (e.g. an artist's "hero" album) —
// opened by clicking a card instead of just quick-playing it, so the
// person can see and pick any song inside before/instead of playing all.
export default function CollectionDetailModal({ collection, player, onClose }) {
  if (!collection) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-full overflow-y-auto rounded-2xl bg-gray-50 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end mb-1">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </button>
        </div>
        <CollectionDetail
          collection={collection}
          activeSong={player.activeSong}
          isPlaying={player.isPlaying}
          favorites={player.favorites}
          onBack={onClose}
          onPlayAll={player.playCollection}
          onPlaySong={player.playSongInCollection}
          onToggleFavorite={player.toggleFavorite}
        />
      </div>
    </div>
  );
}
