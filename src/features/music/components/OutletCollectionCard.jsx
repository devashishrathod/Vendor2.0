import { Play } from "lucide-react";

// A single "Made for Your Outlet" card — clicking the card opens its own
// full album page (onOpen); the small corner play button, revealed on
// hover, quick-plays it immediately instead (onQuickPlay, stopPropagation
// so it doesn't also navigate) — same two-affordance pattern Spotify uses
// on its own album covers. `collection.image` is a real photo; the
// gradient still shows as a fallback tint underneath it.
export default function OutletCollectionCard({ collection, onOpen, onQuickPlay }) {
  return (
    <button type="button" onClick={() => onOpen(collection)} className="group flex-shrink-0 w-36 text-left">
      <div className={`relative w-36 h-28 rounded-xl bg-gradient-to-br ${collection.gradient} overflow-hidden`}>
        {collection.image && (
          <img
            src={collection.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
        <div
          role="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickPlay(collection);
          }}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
          aria-label={`Play ${collection.name}`}
        >
          <Play size={13} fill="black" className="text-black ml-0.5" />
        </div>
      </div>
      <p className="mt-2 text-xs font-semibold text-gray-800 truncate">{collection.name}</p>
      <p className="text-[11px] text-gray-400 truncate">{collection.songs.length} songs</p>
    </button>
  );
}
