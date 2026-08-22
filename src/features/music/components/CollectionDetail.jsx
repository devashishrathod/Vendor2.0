import { ArrowLeft, Play, Pause, Heart } from "lucide-react";

export default function CollectionDetail({
  collection,
  activeSong,
  isPlaying,
  favorites,
  onBack,
  onPlayAll,
  onPlaySong,
  onToggleFavorite,
}) {
  const Icon = collection.icon;
  return (
    <div className="mb-8">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className={`rounded-2xl bg-gradient-to-br ${collection.gradient} p-6 flex items-center gap-4 mb-5`}>
        <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <Icon size={28} className="text-white" />
        </div>
        <div>
          <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Collection</p>
          <h2 className="text-white text-2xl font-bold">{collection.name}</h2>
          <p className="text-white/80 text-xs mt-1">{collection.songs.length} songs</p>
        </div>
        <button
          onClick={() => onPlayAll(collection)}
          className="ml-auto flex-shrink-0 w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          aria-label={`Play all in ${collection.name}`}
        >
          <Play size={18} fill="black" className="text-black ml-0.5" />
        </button>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {collection.songs.map((song, i) => {
          const isActive = activeSong?.id === song.id;
          return (
            <div
              key={song.id}
              onClick={() => onPlaySong(collection, i)}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${
                isActive ? "bg-emerald-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0">
                {isActive && isPlaying ? (
                  <Pause size={14} className="text-emerald-600" fill="currentColor" />
                ) : (
                  <Play size={14} className={isActive ? "text-emerald-600" : "text-gray-400"} fill="currentColor" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${isActive ? "text-emerald-700" : "text-gray-800"}`}>
                  {song.title}
                </p>
                <p className="text-xs text-gray-400 truncate">{song.subtitle}</p>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(song.id);
                }}
                className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                  favorites[song.id] ? "text-red-500" : "text-gray-300 hover:text-red-400"
                }`}
                aria-label="Toggle favorite"
              >
                <Heart size={15} fill={favorites[song.id] ? "currentColor" : "none"} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
