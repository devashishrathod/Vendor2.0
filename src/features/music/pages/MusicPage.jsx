import { useState } from "react";
import { ArrowUpRight, ExternalLink, Headphones, ListMusic, Music2, Play, Waves } from "lucide-react";
import { SPOTIFY_PLAYLISTS, spotifyEmbedUrl, spotifyPlaylistUrl } from "../utils/musicUtils";

export default function MusicPage() {
  const [activePlaylistId, setActivePlaylistId] = useState(SPOTIFY_PLAYLISTS[0].id);
  const activePlaylist = SPOTIFY_PLAYLISTS.find(({ id }) => id === activePlaylistId) || SPOTIFY_PLAYLISTS[0];

  return (
    <div className="min-h-screen bg-[#F8FAF7] pb-28 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="relative mb-7 overflow-hidden rounded-3xl bg-gradient-to-br from-[#10291f] via-[#174a35] to-[#2b7450] px-6 py-7 shadow-lg sm:px-8 sm:py-8">
          <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full border-[18px] border-white/10" />
          <div className="absolute -bottom-16 right-24 h-36 w-36 rounded-full border-[14px] border-emerald-200/10" />
          <div className="relative max-w-xl">
            <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">
              <Headphones size={15} /> Curated for Trydood
            </div>
            <h1 className="font-display text-4xl leading-tight text-white sm:text-5xl">Trydood Playlists</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-emerald-50/75">
              Set the mood for every customer with playlists made for your outlet.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-gray-200/50 dark:bg-gray-800 dark:shadow-black/20">
          <div className="px-4 pt-5 sm:px-6 sm:pt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Waves size={17} className="text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Your sound, your way</h2>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Pick a playlist to start the atmosphere.</p>
              </div>
              <span className="hidden shrink-0 items-center gap-1.5 text-xs font-semibold text-gray-500 sm:flex dark:text-gray-400">
                <Music2 size={14} /> Powered by Spotify
              </span>
            </div>

            <div className="grid gap-2.5 pb-5 sm:grid-cols-3" role="tablist" aria-label="Trydood playlists">
              {SPOTIFY_PLAYLISTS.map((playlist) => {
                const isActive = playlist.id === activePlaylist.id;
                return (
                  <button
                    key={playlist.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActivePlaylistId(playlist.id)}
                    className={`group flex min-h-20 items-center justify-between rounded-2xl px-4 py-3 text-left transition-all ${isActive
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/10"
                      : "bg-gray-50 text-gray-700 hover:bg-emerald-50 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-emerald-500/10"
                      }`}
                  >
                    <span>
                      <span className={`block text-[10px] font-bold uppercase tracking-[0.16em] ${isActive ? "text-emerald-100" : "text-gray-400 dark:text-gray-500"}`}>
                        {playlist.language}
                      </span>
                      <span className="mt-1 block text-sm font-bold">{playlist.label}</span>
                    </span>
                    <ArrowUpRight size={17} className={isActive ? "text-white" : "text-gray-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid min-w-0 gap-4 bg-gray-50 p-3 dark:bg-gray-950 sm:p-5 lg:grid-cols-[250px_minmax(0,1fr)]">
            <div className="relative flex min-h-[300px] min-w-0 flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f2f20] via-[#147448] to-[#06a36f] p-5 text-white shadow-lg shadow-emerald-950/10">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute -bottom-14 -left-8 h-36 w-36 rounded-full bg-white/10" />
              <div className="relative">
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
                  <Music2 size={25} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-100">Trydood selection</p>
                <h2 className="mt-2 text-2xl font-bold leading-tight">{activePlaylist.label}</h2>
                <p className="mt-2 text-xs leading-5 text-white/70">{activePlaylist.description}</p>
              </div>
              <a
                href={spotifyPlaylistUrl(activePlaylist.id)}
                target="_blank"
                rel="noreferrer"
                className="relative mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-bold text-emerald-800 transition-colors hover:bg-emerald-50"
              >
                <Play size={14} fill="currentColor" /> Open playlist <ExternalLink size={13} />
              </a>
            </div>

            <div className="min-w-0 overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-gray-900">
              <div className="flex items-center justify-between bg-gray-50/80 px-4 py-3 dark:bg-gray-800/70">
                <div className="flex items-center gap-2">
                  <ListMusic size={17} className="text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">Song list</h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Browse and play from Spotify</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  Spotify
                </span>
              </div>
              <div className="min-w-0 bg-gray-100/70 p-2 dark:bg-gray-950 sm:p-3">
                <iframe
                  key={activePlaylist.id}
                  src={spotifyEmbedUrl(activePlaylist.id)}
                  title={`${activePlaylist.label} Spotify playlist`}
                  width="100%"
                  height="560"
                  frameBorder="0"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="block min-h-[520px] w-full max-w-full rounded-xl"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
