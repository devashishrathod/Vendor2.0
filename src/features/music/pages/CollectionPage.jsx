import { useParams, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, Play, Pause, Heart } from "lucide-react";
import { useCollections } from "../hooks/useCollections";

/**
 * CollectionPage
 * A single collection's ("album") own page — /music/collection/:collectionId
 * — the same "click an album, get its own page with a track list" pattern
 * Spotify uses, instead of a modal. Reachable from any collection card
 * (mood/outlet, language, artist) in MusicPage.
 */
export default function CollectionPage() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { player } = useOutletContext();
  const { mood, language, artist, loading } = useCollections();

  const collection = [...mood, ...language, ...artist].find((c) => c.id === collectionId);

  const handleBack = () => navigate("/music");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-28">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gray-50 pb-28">
        <div className="max-w-4xl mx-auto px-6 py-10">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-4"
          >
            <ArrowLeft size={16} /> Back to Music
          </button>
          <p className="text-sm text-gray-500">This collection doesn't exist.</p>
        </div>
      </div>
    );
  }

  const Icon = collection.icon;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <div className={`relative overflow-hidden bg-gradient-to-br ${collection.gradient} px-6 pt-8 pb-10 sm:px-10`}>
        {collection.image && (
          <img src={collection.image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-black/25" />

        <div className="relative max-w-4xl mx-auto">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Back to Music
          </button>

          <div className="flex items-end gap-5 flex-wrap">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
              {Icon && <Icon size={42} className="text-white" />}
            </div>
            <div>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-1">Album</p>
              <h1 className="text-white text-2xl sm:text-3xl font-bold mb-1">{collection.name}</h1>
              <p className="text-white/70 text-sm">{collection.songs.length} songs</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <button
          type="button"
          onClick={() => player.playCollection(collection)}
          className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-3 rounded-full mb-6 transition-colors"
        >
          <Play size={16} fill="currentColor" /> Play
        </button>

        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {collection.songs.map((song, i) => {
            const isActive = player.activeSong?.id === song.id;
            return (
              <div
                key={song.id}
                onClick={() => player.playSongInCollection(collection, i)}
                className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-gray-50 last:border-b-0 ${
                  isActive ? "bg-emerald-50" : "hover:bg-gray-50"
                }`}
              >
                <span className="w-6 text-center flex-shrink-0">
                  {isActive && player.isPlaying ? (
                    <Pause size={13} className="text-emerald-600 mx-auto" fill="currentColor" />
                  ) : (
                    <span className="text-xs text-gray-400">{i + 1}</span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${isActive ? "text-emerald-700" : "text-gray-800"}`}>
                    {song.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{song.subtitle}</p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    player.toggleFavorite(song.id);
                  }}
                  className={`p-2 rounded-full transition-colors flex-shrink-0 ${
                    player.favorites[song.id] ? "text-red-500" : "text-gray-300 hover:text-red-400"
                  }`}
                  aria-label="Toggle favorite"
                >
                  <Heart size={15} fill={player.favorites[song.id] ? "currentColor" : "none"} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
