import { useState } from "react";
import { Plus, Send } from "lucide-react";


import CollectionRow from "../components/CollectionRow";
import CollectionDetail from "../components/CollectionDetail";
import PlaylistChips from "../components/PlaylistChips";
import BottomPlayer from "../components/BottomPlayer";
import CreatePlaylistModal from "../components/CreatePlaylistModal";
import RequestPlaylistModal from "../components/RequestPlaylistModal";

import { useCollections } from "../hooks/useCollections";
import { usePlaylists } from "../hooks/usePlaylists";
import { usePlayer } from "../hooks/usePlayer";
import DashboardHeader from "@/features/dashboard/components/DashboardHeader";

export default function MusicPage() {
  const { mood, language, artist, loading } = useCollections();
  const { playlists, requests, createPlaylist, submitRequest } = usePlaylists();
  const player = usePlayer();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [openCollection, setOpenCollection] = useState(null);

  const handleCreatePlaylist = async (name) => {
    await createPlaylist(name);
    setShowCreateModal(false);
  };

  const handleSubmitRequest = async (payload) => {
    await submitRequest(payload);
    setShowRequestModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-28">


      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Heading + actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Music</h1>
            <p className="text-xs text-gray-400 mt-1">Playlists, moods, and languages — pick something to play</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Plus size={16} /> Create playlist
            </button>
            <button
              onClick={() => setShowRequestModal(true)}
              className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-gray-300 text-gray-700 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              <Send size={14} /> Request playlist
            </button>
          </div>
        </div>

        {!openCollection && <PlaylistChips playlists={playlists} requests={requests} />}

        {openCollection ? (
          <CollectionDetail
            collection={openCollection}
            activeSong={player.activeSong}
            isPlaying={player.isPlaying}
            favorites={player.favorites}
            onBack={() => setOpenCollection(null)}
            onPlayAll={player.playCollection}
            onPlaySong={player.playSongInCollection}
            onToggleFavorite={player.toggleFavorite}
          />
        ) : loading ? (
          <div className="space-y-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <CollectionRow
              title="Mood & activity"
              collections={mood}
              onOpen={setOpenCollection}
              onQuickPlay={player.playCollection}
            />
            <CollectionRow
              title="By language"
              collections={language}
              onOpen={setOpenCollection}
              onQuickPlay={player.playCollection}
            />
            <CollectionRow
              title="Artist specials"
              collections={artist}
              onOpen={setOpenCollection}
              onQuickPlay={player.playCollection}
            />
          </>
        )}
      </div>

      <BottomPlayer player={player} />

      {showCreateModal && (
        <CreatePlaylistModal onClose={() => setShowCreateModal(false)} onCreate={handleCreatePlaylist} />
      )}
      {showRequestModal && (
        <RequestPlaylistModal onClose={() => setShowRequestModal(false)} onSubmit={handleSubmitRequest} />
      )}
    </div>
  );
}
