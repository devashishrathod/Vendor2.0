import { useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { Headphones } from "lucide-react";
import PlaylistBrowser from "../components/PlaylistBrowser";
import { usePlaylistCatalog } from "../hooks/usePlaylistCatalog";
import { usePlaylistPlayback } from "../hooks/usePlaylistPlayback";
import { useMusicStore } from "../store";

export default function MusicPage() {
  const navigate = useNavigate();
  const { player } = useOutletContext();
  const { playlists, loading, error } = usePlaylistCatalog();
  const { isPlaylistCurrent, isPlaylistPlaying, playPlaylist } = usePlaylistPlayback(player);
  const favouriteIds = useMusicStore((s) => s.favouritePlaylistIds);
  const toggleFavouritePlaylist = useMusicStore((s) => s.toggleFavouritePlaylist);

  const openPlaylist = useCallback((playlist) => navigate(`/music/playlist/${playlist.id}`), [navigate]);

  return (
    <div className="min-h-screen bg-app pb-32 dark:bg-gray-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <div className="relative flex flex-wrap items-end justify-between gap-6 overflow-hidden rounded-3xl bg-gradient-to-br from-[#10291f] via-[#174a35] to-[#2b7450] p-6 shadow-lg sm:p-8">
          <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border-[18px] border-white/10" />
          <div className="relative max-w-xl">
            <div className="mb-3.5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
              <Headphones size={15} /> Curated for Trydood
            </div>
            <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">Trydood Playlists</h1>
            <p className="mt-3 text-sm leading-6 text-emerald-100">
              Set the mood for every customer — browse by year, your favourite stars or the voices you love.
            </p>
          </div>
          <div className="relative flex flex-wrap gap-3">
            <div className="min-w-[110px] rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-extrabold text-white">{playlists.length}</p>
              <p className="text-xs text-emerald-100">Playlists</p>
            </div>
            <div className="min-w-[110px] rounded-2xl bg-white/10 px-4 py-3">
              <p className="text-2xl font-extrabold text-white">{favouriteIds.length}</p>
              <p className="text-xs text-emerald-100">Favourites</p>
            </div>
          </div>
        </div>

        {error ? (
          <p className="bento-card py-10 text-center text-sm text-rose-500">{error}</p>
        ) : loading ? (
          <div className="bento-card h-96 animate-pulse" />
        ) : (
          <PlaylistBrowser
            playlists={playlists}
            favouriteIds={favouriteIds}
            isPlaylistCurrent={isPlaylistCurrent}
            isPlaylistPlaying={isPlaylistPlaying}
            onOpen={openPlaylist}
            onPlay={playPlaylist}
            onToggleFavourite={toggleFavouritePlaylist}
          />
        )}
      </div>
    </div>
  );
}
