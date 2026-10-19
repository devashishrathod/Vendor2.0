import { useCallback, useMemo, useState } from "react";
import { CalendarDays, Clapperboard, Heart, LayoutGrid, ListMusic, Mic, Search } from "lucide-react";
import {
  MUSIC_BROWSE_TABS,
  MUSIC_ERAS,
  MUSIC_GENDER_FILTERS,
  MUSIC_TAB_TITLES,
} from "../constants/musicConstants";
import PlaylistCard from "./PlaylistCard";

const TAB_ICONS = {
  all: LayoutGrid,
  year: CalendarDays,
  actor: Clapperboard,
  singer: Mic,
  favourites: Heart,
};

/**
 * Tabs (All / Year / Actors / Singers / Favourites), sub-filters, search
 * and the playlist grid on the Music page.
 */
export default function PlaylistBrowser({
  playlists,
  favouriteIds,
  isPlaylistCurrent,
  isPlaylistPlaying,
  onOpen,
  onPlay,
  onToggleFavourite,
}) {
  const [tab, setTab] = useState("all");
  const [era, setEra] = useState("All");
  const [gender, setGender] = useState("all");
  const [query, setQuery] = useState("");

  const inTab = useCallback(
    (playlist, key) => {
      if (key === "all") return true;
      if (key === "favourites") return favouriteIds.includes(playlist.id);
      return playlist.category === key;
    },
    [favouriteIds]
  );

  const tabCounts = useMemo(
    () => Object.fromEntries(MUSIC_BROWSE_TABS.map(({ key }) => [key, playlists.filter((p) => inTab(p, key)).length])),
    [playlists, inTab]
  );

  const isGenderTab = tab === "actor" || tab === "singer";
  const q = query.trim().toLowerCase();

  // Everything except the gender filter — the gender toggle counts from this.
  const beforeGender = useMemo(() => {
    const matchesQuery = (p) =>
      !q ||
      [p.title, p.vibe, ...p.tracks.flatMap((t) => [t.title, t.artist])].join(" ").toLowerCase().includes(q);
    return playlists.filter(
      (p) => inTab(p, tab) && matchesQuery(p) && (tab !== "year" || era === "All" || p.era === era)
    );
  }, [playlists, inTab, tab, era, q]);

  const visible = useMemo(
    () => (isGenderTab && gender !== "all" ? beforeGender.filter((p) => p.gender === gender) : beforeGender),
    [beforeGender, isGenderTab, gender]
  );

  const pickTab = (key) => {
    setTab(key);
    setEra("All");
    setGender("all");
  };

  let listTitle = MUSIC_TAB_TITLES[tab];
  if (tab === "year" && era !== "All") listTitle += ` · ${era}`;
  if (isGenderTab && gender !== "all") listTitle += ` · ${gender === "female" ? "Female" : "Male"}`;

  const showFavouritesHint = tab === "favourites" && !q;

  return (
    <div className="bento-card flex flex-col gap-5 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <ListMusic size={18} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Your sound, your way</h2>
            <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
              Open a playlist to see every song, or hit play straight away.
            </p>
          </div>
        </div>
        <label className="flex h-11 min-w-[200px] flex-[0_1_300px] items-center gap-2 rounded-full border border-gray-200 bg-white px-3.5 text-gray-500 dark:border-gray-700 dark:bg-gray-900">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">Search playlists</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search playlist, actor, singer…"
            className="w-full bg-transparent text-[13px] text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Browse playlists">
        {MUSIC_BROWSE_TABS.map(({ key, label }) => {
          const Icon = TAB_ICONS[key];
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => pickTab(key)}
              className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-colors ${
                active
                  ? "border-gray-900 bg-gray-900 text-white dark:border-emerald-600 dark:bg-emerald-600"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              }`}
            >
              <Icon size={15} />
              {label}
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {tabCounts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "year" && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-gray-50 p-3 dark:bg-gray-900/60">
          <span className="px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">Decade</span>
          {MUSIC_ERAS.map((value) => {
            const active = era === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => setEra(value)}
                className={`h-9 min-w-14 rounded-full border px-3.5 text-[13px] font-bold transition-colors ${
                  active
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-emerald-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
      )}

      {isGenderTab && (
        <div
          className="inline-flex gap-1 self-start rounded-full bg-gray-100 p-1 dark:bg-gray-900/60"
          role="group"
          aria-label="Filter by gender"
        >
          {MUSIC_GENDER_FILTERS.map(({ key, label }) => {
            const active = gender === key;
            const count = key === "all" ? beforeGender.length : beforeGender.filter((p) => p.gender === key).length;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setGender(key)}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors ${
                  active
                    ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400"
                }`}
              >
                {label}
                <span className="text-[11px] text-gray-500 dark:text-gray-400">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">{listTitle}</h3>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {visible.length} {visible.length === 1 ? "playlist" : "playlists"}
        </span>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
          {visible.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              isCurrent={isPlaylistCurrent(playlist.id)}
              isPlaying={isPlaylistPlaying(playlist.id)}
              isFavourite={favouriteIds.includes(playlist.id)}
              onOpen={onOpen}
              onPlay={onPlay}
              onToggleFavourite={onToggleFavourite}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-gray-300 bg-white/60 px-4 py-10 text-center dark:border-gray-700 dark:bg-gray-800/40">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10">
            <Heart size={22} />
          </div>
          <p className="text-[15px] font-bold text-gray-900 dark:text-gray-100">
            {showFavouritesHint ? "No favourites yet" : "No playlists found"}
          </p>
          <p className="max-w-[340px] text-[13px] text-gray-500 dark:text-gray-400">
            {showFavouritesHint
              ? "Tap the heart on any playlist to keep it here for quick play."
              : "Try another decade, filter or search term."}
          </p>
        </div>
      )}
    </div>
  );
}
